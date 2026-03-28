// ═══════════════════════════════════════════════════════════════
// settings-gate-questions.js — Gate Question Definitions settings tab
// Depends on: settings.js (shared helpers), supabase (auth.js)
// ═══════════════════════════════════════════════════════════════

let settingsGateQuestionsLoading = false;
let settingsGateQuestionsError   = null;
let settingsGateQuestionsData    = null; // array of rows from gate_question_definitions
let settingsGateQuestionsEditing = null; // { id } of row currently in edit mode
let settingsGateQuestionsAdding  = null; // gate_num of gate currently showing add form

// ── Data loading ──────────────────────────────────────────────
async function settingsEnsureGateQuestionsData(forceReload = false) {
  if (settingsGateQuestionsLoading) return;
  if (!forceReload && settingsGateQuestionsData !== null) {
    renderSettingsGateQuestionsTab();
    return;
  }

  settingsGateQuestionsLoading = true;
  settingsGateQuestionsError   = null;
  renderSettingsGateQuestionsTab();

  try {
    const { data, error } = await supa
      .from('gate_question_definitions')
      .select('id, gate_num, gate_name, phase, question_text, sort_order')
      .order('gate_num', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw error;
    settingsGateQuestionsData = data || [];
    return settingsGateQuestionsData;
  } catch (err) {
    settingsGateQuestionsError = err?.message || 'Failed to load gate questions';
    settingsGateQuestionsData  = null;
    throw err;
  } finally {
    settingsGateQuestionsLoading = false;
    renderSettingsGateQuestionsTab();
  }
}

// ── Render ─────────────────────────────────────────────────────
function renderSettingsGateQuestionsTab() {
  const container = document.getElementById('settingsGateQuestionsTab');
  if (!container) return;

  if (settingsGateQuestionsLoading) {
    container.innerHTML = settingsLoadingState('Loading gate questions…');
    return;
  }

  if (settingsGateQuestionsError) {
    container.innerHTML = `
      <div style="padding:24px;border:1px solid var(--line);border-radius:6px;background:var(--white)">
        <div style="font-weight:600;color:var(--red);margin-bottom:8px">Failed to load gate questions</div>
        <div style="color:var(--mid);font-size:13px;margin-bottom:12px">${esc(settingsGateQuestionsError)}</div>
        <button class="btn btn-ghost" data-action="settings-gq-retry">Retry</button>
      </div>`;
    return;
  }

  if (!settingsGateQuestionsData) {
    container.innerHTML = settingsLoadingState('Loading…');
    settingsEnsureGateQuestionsData(true);
    return;
  }

  const admin = isAdmin();
  const rows  = settingsGateQuestionsData;

  // Group by gate_num using GATE_DEFS for metadata
  const gateBlocks = GATE_DEFS.map(g => {
    const gateRows = rows.filter(r => r.gate_num === g.num);
    const isAdding = settingsGateQuestionsAdding === g.num;

    const questionRows = gateRows.map((row, i) => {
      const isEditing = settingsGateQuestionsEditing === row.id;

      if (isEditing) {
        // Use JSON.stringify for safe attribute values (prevents double-escaping)
        const safeText = JSON.stringify(row.question_text || '');
        const safeSort = JSON.stringify(String(row.sort_order));
        return `
          <div style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line)">
            <span style="font-size:12px;font-family:'IBM Plex Mono',monospace;color:var(--muted);padding-top:8px;min-width:28px">Q${i+1}.</span>
            <input id="gq-edit-text-${esc(row.id)}"
              value=${safeText}
              style="flex:1;padding:6px 9px;border:1px solid var(--blue);border-radius:5px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none"
              placeholder="Question text">
            <input id="gq-edit-sort-${esc(row.id)}" type="number" min="1"
              value=${safeSort}
              style="width:60px;padding:6px 9px;border:1px solid var(--blue);border-radius:5px;font-size:13px;text-align:center;font-family:'IBM Plex Sans',sans-serif;outline:none"
              title="Sort order">
            <button class="btn btn-sm btn-primary"
              data-action="settings-gq-save-edit"
              data-id="${esc(row.id)}">Save</button>
            <button class="btn btn-sm btn-ghost"
              data-action="settings-gq-cancel-edit">Cancel</button>
          </div>`;
      }

      return `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line)">
          <span style="font-size:12px;font-family:'IBM Plex Mono',monospace;color:var(--muted);min-width:28px">Q${i+1}.</span>
          <span style="flex:1;font-size:13px;color:var(--ink)">${esc(row.question_text)}</span>
          ${admin ? `
            <button class="btn btn-sm btn-ghost"
              data-action="settings-gq-start-edit"
              data-id="${esc(row.id)}"
              title="Edit question">Edit</button>
            <button class="btn btn-sm btn-ghost" style="color:var(--red)"
              data-action="settings-gq-delete"
              data-id="${esc(row.id)}"
              data-text="${esc(row.question_text)}"
              title="Delete question">Delete</button>
          ` : ''}
        </div>`;
    }).join('');

    const addForm = isAdding ? `
      <div style="display:flex;gap:8px;align-items:flex-start;padding:10px 0 4px">
        <input id="gq-add-text-${g.num}"
          style="flex:1;padding:6px 9px;border:1px solid var(--blue);border-radius:5px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none"
          placeholder="New question text…"
          autofocus>
        <button class="btn btn-sm btn-primary"
          data-action="settings-gq-confirm-add"
          data-gate="${g.num}">Add</button>
        <button class="btn btn-sm btn-ghost"
          data-action="settings-gq-cancel-add">Cancel</button>
      </div>` : '';

    const addButton = admin && !isAdding ? `
      <div style="padding-top:10px">
        <button class="btn btn-ghost btn-sm"
          data-action="settings-gq-start-add"
          data-gate="${g.num}">+ Add question</button>
      </div>` : '';

    return `
      <div class="card" style="margin-bottom:16px">
        <div class="card-head">
          <span class="card-title">Gate ${g.num} — ${esc(g.name)}</span>
          <span class="card-meta" style="font-family:'IBM Plex Mono',monospace;font-size:11px">${esc(g.phase)} · ${gateRows.length} question${gateRows.length !== 1 ? 's' : ''}</span>
        </div>
        <div style="padding:0 16px 12px">
          ${questionRows || `<div style="color:var(--muted);font-size:13px;padding:8px 0">No questions defined for this gate.</div>`}
          ${addForm}
          ${addButton}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Gate Questions</h2>
      <p class="settings-section-desc">
        Checklist questions shown at each APQP gate review. Changes apply to all future projects.
      </p>
    </div>
    ${!admin ? `<div class="permissions-notice">Only admins can edit gate questions. Your current role is <strong>${esc(currentUserRole || 'editor')}</strong>.</div>` : ''}
    ${gateBlocks}
  `;
}

// ── Add ────────────────────────────────────────────────────────
function settingsGateQuestionsStartAdd(gateNum) {
  if (!isAdmin()) { showToast('Only admins can add gate questions.', 'error'); return; }
  settingsGateQuestionsAdding  = Number(gateNum);
  settingsGateQuestionsEditing = null;
  renderSettingsGateQuestionsTab();
  // Focus the new input after render
  requestAnimationFrame(() => {
    document.getElementById(`gq-add-text-${gateNum}`)?.focus();
  });
}

function settingsGateQuestionsCancelAdd() {
  settingsGateQuestionsAdding = null;
  renderSettingsGateQuestionsTab();
}

async function settingsGateQuestionsConfirmAdd(gateNum) {
  if (!isAdmin()) { showToast('Only admins can add gate questions.', 'error'); return; }

  const input = document.getElementById(`gq-add-text-${gateNum}`);
  const text  = input ? input.value.trim() : '';
  if (!text) { showToast('Please enter question text.', 'warning'); return; }

  const gateDef = GATE_DEFS.find(g => g.num === Number(gateNum));
  if (!gateDef) return;

  const gateRows   = (settingsGateQuestionsData || []).filter(r => r.gate_num === Number(gateNum));
  const maxSort    = gateRows.length > 0 ? Math.max(...gateRows.map(r => r.sort_order)) : 0;
  const sortOrder  = maxSort + 1;

  const { data, error } = await supa
    .from('gate_question_definitions')
    .insert([{
      gate_num:      Number(gateNum),
      gate_name:     gateDef.name,
      phase:         gateDef.phase,
      question_text: text,
      sort_order:    sortOrder,
    }])
    .select()
    .single();

  if (error) {
    showToast('Failed to add question: ' + error.message, 'error');
    return;
  }

  settingsGateQuestionsData.push(data);
  // Re-sort in memory
  settingsGateQuestionsData.sort((a, b) => a.gate_num - b.gate_num || a.sort_order - b.sort_order);
  settingsGateQuestionsAdding = null;
  showToast('Question added', 'success');
  renderSettingsGateQuestionsTab();
}

// ── Edit ───────────────────────────────────────────────────────
function settingsGateQuestionsStartEdit(id) {
  if (!isAdmin()) { showToast('Only admins can edit gate questions.', 'error'); return; }
  settingsGateQuestionsEditing = id;
  settingsGateQuestionsAdding  = null;
  renderSettingsGateQuestionsTab();
}

function settingsGateQuestionsCancelEdit() {
  settingsGateQuestionsEditing = null;
  renderSettingsGateQuestionsTab();
}

async function settingsGateQuestionsSaveEdit(id) {
  if (!isAdmin()) { showToast('Only admins can edit gate questions.', 'error'); return; }

  const textEl = document.getElementById(`gq-edit-text-${id}`);
  const sortEl = document.getElementById(`gq-edit-sort-${id}`);
  const text   = textEl ? textEl.value.trim() : '';
  const sort   = sortEl ? parseInt(sortEl.value, 10) : null;

  if (!text) { showToast('Question text cannot be empty.', 'warning'); return; }
  if (!sort || sort < 1) { showToast('Sort order must be a positive number.', 'warning'); return; }

  const { error } = await supa
    .from('gate_question_definitions')
    .update({ question_text: text, sort_order: sort })
    .eq('id', id);

  if (error) {
    showToast('Failed to save: ' + error.message, 'error');
    return;
  }

  const row = (settingsGateQuestionsData || []).find(r => r.id === id);
  if (row) { row.question_text = text; row.sort_order = sort; }
  settingsGateQuestionsData.sort((a, b) => a.gate_num - b.gate_num || a.sort_order - b.sort_order);
  settingsGateQuestionsEditing = null;
  showToast('Question saved', 'success');
  renderSettingsGateQuestionsTab();
}

// ── Delete ─────────────────────────────────────────────────────
async function settingsGateQuestionsDelete(id, text) {
  if (!isAdmin()) { showToast('Only admins can delete gate questions.', 'error'); return; }
  if (!confirm(`Delete this question?\n\n"${text}"\n\nThis cannot be undone.`)) return;

  const { error } = await supa
    .from('gate_question_definitions')
    .delete()
    .eq('id', id);

  if (error) {
    showToast('Failed to delete: ' + error.message, 'error');
    return;
  }

  settingsGateQuestionsData = (settingsGateQuestionsData || []).filter(r => r.id !== id);
  showToast('Question deleted', 'info');
  renderSettingsGateQuestionsTab();
}

// ── Cleanup ────────────────────────────────────────────────────
function teardownSettingsGateQuestions() {
  settingsGateQuestionsLoading = false;
  settingsGateQuestionsError   = null;
  settingsGateQuestionsData    = null;
  settingsGateQuestionsEditing = null;
  settingsGateQuestionsAdding  = null;
}
