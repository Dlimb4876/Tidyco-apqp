// ═══════════════════════════════════════════════════════════════
// teams-data.js — Teams Data Layer
// Manages teams (ME, PM, OPS, Admin, ReadOnly) and their
// permissions in Supabase.
// Depends on: auth.js (supa, currentUser)
// ═══════════════════════════════════════════════════════════════

// ── Load all teams ───────────────────────────────────────────────
async function teamsDataLoadAll() {
  const { data, error } = await supa
    .from('teams')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ── Get user count for a team ────────────────────────────────────
async function teamsDataGetUserCount(teamId) {
  if (!teamId) return 0;

  const { count, error } = await supa
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId);

  if (error) {
    console.error('Error counting team members:', error);
    return 0;
  }
  return count || 0;
}

// ── Add a new team ───────────────────────────────────────────────
async function teamsDataAdd({ name, team_type, description = '' }) {
  if (!name || !team_type) return null;

  const { data, error } = await supa
    .from('teams')
    .insert([{ name: name.trim(), team_type: team_type.trim(), description: description.trim() }])
    .select();

  if (error) throw error;
  return data && data[0] ? data[0] : null;
}

// ── Update a team ────────────────────────────────────────────────
async function teamsDataUpdate(teamId, updates) {
  if (!teamId) return false;

  const { error } = await supa
    .from('teams')
    .update(updates)
    .eq('id', teamId);

  if (error) throw error;
  return true;
}

// ── Delete a team ────────────────────────────────────────────────
async function teamsDataDelete(teamId) {
  if (!teamId) return false;

  const { error } = await supa
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (error) throw error;
  return true;
}

// ── Load permissions for a team ──────────────────────────────────
async function teamsDataLoadPermissions(teamId) {
  if (!teamId) return [];

  const { data, error } = await supa
    .from('team_permissions')
    .select('permission, allowed')
    .eq('team_id', teamId);

  if (error) throw error;
  return data || [];
}

// ── Load user-to-team assignments ───────────────────────────────
async function teamsDataLoadUserTeamMap() {
  const { data, error } = await supa
    .from('team_members')
    .select('user_id, team_id, teams(name)')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const map = {};
  (data || []).forEach((row) => {
    if (!row.user_id) return;
    // Single-team assignment policy: keep first row only if duplicates exist.
    if (map[row.user_id]) return;
    map[row.user_id] = {
      teamId: row.team_id || '',
      teamName: row.teams?.name || ''
    };
  });

  return map;
}

// ── Set a user's team assignment (single team) ─────────────────
async function teamsDataSetUserTeam(userId, teamId) {
  if (!userId) return false;

  const { error: deleteError } = await supa
    .from('team_members')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  if (!teamId) return true;

  const { error: insertError } = await supa
    .from('team_members')
    .insert([{ user_id: userId, team_id: teamId }]);

  if (insertError) throw insertError;
  return true;
}

// ── Save (upsert) permissions for a team ─────────────────────────
async function teamPermissionsDataSave(teamId, permissions) {
  if (!teamId || !Array.isArray(permissions)) return false;

  // Upsert all incoming permissions first so there is never a window
  // with no permissions (avoids the delete-then-insert race condition).
  if (permissions.length > 0) {
    const rows = permissions.map(p => ({
      team_id: teamId,
      permission: p.permission,
      allowed: p.allowed
    }));

    const { error: upsertError } = await supa
      .from('team_permissions')
      .upsert(rows, { onConflict: 'team_id,permission' });

    if (upsertError) throw upsertError;
  }

  // Remove any permissions that are no longer in the new set
  const keepPermissions = permissions.map(p => p.permission);
  if (keepPermissions.length > 0) {
    const { error: delError } = await supa
      .from('team_permissions')
      .delete()
      .eq('team_id', teamId)
      .not('permission', 'in', `(${keepPermissions.map(p => `"${p}"`).join(',')})`);

    if (delError) throw delError;
  } else {
    // No permissions to keep — delete them all
    const { error: delError } = await supa
      .from('team_permissions')
      .delete()
      .eq('team_id', teamId);

    if (delError) throw delError;
  }

  return true;
}
