// ═══════════════════════════════════
// auth.js — Supabase authentication
// Depends on: state.js (currentUser), db.js (launchApp via app.js)
// ═══════════════════════════════════

const SUPA_URL = 'https://eihxvmzsfnpdaizggsvs.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaHh2bXpzZm5wZGFpemdnc3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTc2OTMsImV4cCI6MjA4ODM3MzY5M30.edpoNia_4nGRwUBwVAFrKXgyB3SnhH_umU2mcNTBIco';
const supa     = supabase.createClient(SUPA_URL, SUPA_KEY);
let   currentUser = null;

async function authLoadEffectivePermissions(userId, roleSlug) {
  const baseline = typeof getRoleBaselinePermissions === 'function'
    ? getRoleBaselinePermissions(roleSlug)
    : {};
  const resolved = { ...baseline };
  const assignedTeamIds = [];

  try {
    const { data: memberships, error: membershipsError } = await supa
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (!membershipsError && Array.isArray(memberships) && memberships.length > 0) {
      memberships
        .map((row) => row.team_id)
        .filter(Boolean)
        .forEach((teamId) => {
          if (!assignedTeamIds.includes(teamId)) assignedTeamIds.push(teamId);
        });
    }

    if (assignedTeamIds.length > 0) {
      const { data: grants, error: grantsError } = await supa
        .from('team_permissions')
        .select('permission, allowed')
        .in('team_id', assignedTeamIds);

      if (!grantsError && Array.isArray(grants)) {
        grants.forEach((grant) => {
          const key = typeof normalizePermissionKey === 'function'
            ? normalizePermissionKey(grant.permission)
            : grant.permission;
          if (key) {
            // Explicit denials (allowed: false) override role baseline
            // Explicit grants (allowed: true) also override
            resolved[key] = !!grant.allowed;
          }
        });
      }
    }
  } catch (_) {
    // Keep baseline-only permissions if team tables are not yet available.
  }

  if (typeof currentUserPermissions !== 'undefined') currentUserPermissions = resolved;
  if (typeof currentUserTeams !== 'undefined') currentUserTeams = assignedTeamIds;
}

async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');
  const err      = document.getElementById('loginErr');
  err.style.display = 'none';
  if (!email || !password) { showLoginErr('Please enter your email and password.'); return; }
  if (!email.endsWith('@tidyco.co.uk')) { showLoginErr('Please use your @tidyco.co.uk email address.'); return; }
  btn.disabled = true; btn.textContent = 'Signing in…';
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  btn.disabled = false; btn.textContent = 'Sign in';
  if (error) { showLoginErr(error.message); return; }
  currentUser = data.user;
  // Load role from profiles table; default to 'editor' if no profile row found
  try {
    const { data: profile } = await supa
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
    currentUserRole = profile?.role || 'editor';
  } catch (_) {
    currentUserRole = 'editor';
  }

  await authLoadEffectivePermissions(data.user.id, currentUserRole);
  launchApp();
}

function showLoginErr(msg) {
  const e = document.getElementById('loginErr');
  e.textContent = msg; e.style.display = 'block';
}

async function doLogout() {
  currentUser = null;     // set null before signOut so onAuthStateChange guard doesn't re-enter
  currentUserRole = null;
  if (typeof currentUserPermissions !== 'undefined') currentUserPermissions = {};
  if (typeof currentUserTeams !== 'undefined') currentUserTeams = [];
  await supa.auth.signOut();
  db = { projects: [] }; progId = null;
  document.getElementById('appShell').style.display   = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
}

// If the refresh token expires mid-session, Supabase emits SIGNED_OUT.
// Redirect to the login screen automatically.
supa.auth.onAuthStateChange((event, _session) => {
  if (event === 'SIGNED_OUT' && currentUser !== null) {
    doLogout();
  }
});
