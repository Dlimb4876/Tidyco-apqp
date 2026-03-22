/* ============================================================
   npi-data-relational.js — NPI Relational DB Operations

   Handles all Supabase table operations for:
   npi_ctq, npi_pfd_steps, npi_pfmea_modes, npi_pfmea_effects,
   npi_pfmea_causes, npi_pfmea_history, npi_control_plan,
   npi_bom_items, npi_bom_kits, npi_bom_kit_items,
   npi_gates, npi_gate_sigs, npi_actions, npi_risks, npi_gantt_rows

   All save functions use upsert (onConflict: 'id') so they work
   for both new inserts and updates without separate code paths.

   Depends on: state.js (prog, progId, currentUser), auth.js (supa)
   ============================================================ */

function npiRelLooksLikeUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function npiRelFindProject(targetProgId) {
  if (!targetProgId || !db || !Array.isArray(db.projects)) return null;
  return db.projects.find(p => p && p.id === targetProgId) || null;
}

function npiRelIsHeaderStep(type) {
  return type === 'header' || type === 'group';
}

function npiRelPersistedPfdStepNum(step, pfd) {
  if (!step) return 0;
  if (!npiRelIsHeaderStep(step.type)) return Number(step.stepNum) || 0;

  const rows = Array.isArray(pfd) ? pfd : [];
  const executableById = new Map(
    rows
      .filter(item => item && !npiRelIsHeaderStep(item.type))
      .map(item => [item.id, item])
  );

  if (step.beforeStepId) {
    const beforeAnchor = executableById.get(step.beforeStepId);
    const beforeNum = beforeAnchor ? Number(beforeAnchor.stepNum) : NaN;
    if (Number.isFinite(beforeNum)) return Math.max(0, beforeNum - 1);
  }

  if (step.afterStepId) {
    const afterAnchor = executableById.get(step.afterStepId);
    const afterNum = afterAnchor ? Number(afterAnchor.stepNum) : NaN;
    if (Number.isFinite(afterNum)) return afterNum;
  }

  return 0;
}

function npiRelHydratePfdRows(rows) {
  const source = Array.isArray(rows) ? rows : [];
  const executableRows = source
    .filter(row => !npiRelIsHeaderStep(row.step_type))
    .sort((a, b) => (a.step_num || 0) - (b.step_num || 0));

  const executable = executableRows.map(row => ({
    id: row.id,
    stepNum: row.step_num,
    type: row.step_type || 'step',
    op: row.op || '',
    detail: row.detail || '',
    ctqIds: row.ctq_ids || [],
    bomRefs: row.bom_refs || [],
    docRefs: row.doc_refs || [],
    pfd_type: row.pfd_type || 'Process',
    nextStepId: row.next_step_num != null ? row.next_step_num : null,
    nextStepId_yes: row.next_step_num_yes != null ? row.next_step_num_yes : null,
    nextStepId_no: row.next_step_num_no != null ? row.next_step_num_no : null
  }));

  const firstExecutable = executableRows[0] || null;

  const headers = source
    .filter(row => npiRelIsHeaderStep(row.step_type))
    .map(row => {
      const stepNum = Number(row.step_num);
      const header = {
        id: row.id,
        stepNum: null,
        type: row.step_type || 'header',
        op: row.op || '',
        detail: row.detail || '',
        ctqIds: row.ctq_ids || [],
        bomRefs: row.bom_refs || [],
        docRefs: row.doc_refs || [],
        pfd_type: null,
        nextStepId: null,
        nextStepId_yes: null,
        nextStepId_no: null
      };

      if (firstExecutable && Number.isFinite(stepNum) && stepNum < Number(firstExecutable.step_num)) {
        header.beforeStepId = firstExecutable.id;
        header.isDefault = true;
        return header;
      }

      let anchor = null;
      executableRows.forEach(candidate => {
        if (Number(candidate.step_num) <= stepNum) anchor = candidate;
      });

      if (anchor) header.afterStepId = anchor.id;
      else if (firstExecutable) {
        header.beforeStepId = firstExecutable.id;
        header.isDefault = true;
      }

      return header;
    });

  return executable.concat(headers);
}

window.npiRelHydratePfdRows = npiRelHydratePfdRows;

window.npiRelResolveProjectId = async function(targetProgId) {
  if (!targetProgId) return null;
  const project = npiRelFindProject(targetProgId);
  if (project && project.dbId) return project.dbId;
  if (npiRelLooksLikeUuid(targetProgId)) return targetProgId;

  try {
    const { data, error } = await supa
      .from('projects')
      .select('id, prog_id')
      .eq('prog_id', targetProgId)
      .limit(1);
    if (error) {
      console.warn('npiRelResolveProjectId error:', error.message);
      return null;
    }
    const resolved = data && data[0] ? data[0].id : null;
    if (project && resolved) project.dbId = resolved;
    return resolved;
  } catch (err) {
    console.warn('npiRelResolveProjectId exception:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// LOAD — fetch all NPI tables for a project into memory
// ─────────────────────────────────────────────────────────────

window.npiRelLoad = async function(pid) {
  const projectId = await window.npiRelResolveProjectId(pid);
  if (!projectId) return;
  const p = prog();
  if (!p) return;

  try {
    const [
      ctqRes, pfdRes, modesRes, effectsRes, causesRes, histRes,
      cpRes, bomRes, kitsRes, kitItemsRes, gatesRes, gateSigsRes,
      actionsRes, risksRes, ganttRes, docsRes
    ] = await Promise.all([
      supa.from('npi_ctq').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_pfd_steps').select('*').eq('project_id', projectId).order('step_num'),
      supa.from('npi_pfmea_modes').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_pfmea_effects').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_pfmea_causes').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_pfmea_history').select('*').eq('project_id', projectId),
      supa.from('npi_control_plan').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_bom_items').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_bom_kits').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_bom_kit_items').select('*').eq('project_id', projectId),
      supa.from('npi_gates').select('*').eq('project_id', projectId),
      supa.from('npi_gate_sigs').select('*').eq('project_id', projectId),
      supa.from('npi_actions').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_risks').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_gantt_rows').select('*').eq('project_id', projectId).order('sort_order'),
      supa.from('npi_documents').select('*').eq('project_id', projectId).order('sort_order')
    ]);

    // ── CTQ ──────────────────────────────────────────────────
    if (!ctqRes.error) {
      p.ctq = (ctqRes.data || []).map(r => ({
        id: r.id,
        req: r.req || '',
        spec: r.spec || '',
        testMethod: r.test_method || '',
        source: r.source || 'Customer Spec',
        oos_action: r.oos_action || 'TBD',
        customerAgreed: r.customer_agreed || false
      }));
    }

    // ── PFD Steps ────────────────────────────────────────────
    if (!pfdRes.error) {
      p.pfd = npiRelHydratePfdRows(pfdRes.data || []);
    }

    // ── PFMEA (nested: modes → effects → causes + history) ──
    if (!modesRes.error && !effectsRes.error && !causesRes.error) {
      const histByC = {};
      (histRes.data || []).forEach(h => {
        if (!histByC[h.cause_id]) histByC[h.cause_id] = [];
        histByC[h.cause_id].push({
          id: h.id,
          rpn: h.rpn,
          newRpn: h.new_rpn,
          oldOcc: h.old_occ,
          oldDet: h.old_det,
          newOcc: h.new_occ,
          newDet: h.new_det,
          desc: h.description || '',
          date: h.event_date || ''
        });
      });

      const causesByEff = {};
      (causesRes.data || []).forEach(ca => {
        if (!causesByEff[ca.effect_id]) causesByEff[ca.effect_id] = [];
        causesByEff[ca.effect_id].push({
          id: ca.id,
          cause: ca.cause || '',
          occ: ca.occ || 1,
          det: ca.det || 1,
          prevent: ca.prevent || '',
          detect: ca.detect || '',
          action: {
            desc: ca.action_desc || '',
            taken: ca.action_taken || '',
            owner: ca.action_owner || '',
            due: ca.action_due || '',
            newOcc: ca.action_new_occ != null ? ca.action_new_occ : '',
            newDet: ca.action_new_det != null ? ca.action_new_det : ''
          },
          history: histByC[ca.id] || []
        });
      });

      const effsByMode = {};
      (effectsRes.data || []).forEach(ef => {
        if (!effsByMode[ef.mode_id]) effsByMode[ef.mode_id] = [];
        effsByMode[ef.mode_id].push({
          id: ef.id,
          effect: ef.effect || '',
          sev: ef.sev || 1,
          causes: causesByEff[ef.id] || []
        });
      });

      p.pfmea = (modesRes.data || []).map(m => ({
        id: m.id,
        _type: 'mode',
        pfdId: m.pfd_step_id || '',
        mode: m.mode || '',
        ctqIds: m.ctq_ids || [],
        effects: effsByMode[m.id] || []
      }));
    }

    // ── Control Plan ─────────────────────────────────────────
    if (!cpRes.error) {
      p.cp = (cpRes.data || []).map(r => ({
        id: r.id,
        pfmeaId: r.pfmea_mode_id || '',
        pfmeaEffectId: r.pfmea_effect_id || '',
        pfmeaCauseId: r.pfmea_cause_id || '',
        pfdId: r.pfd_step_id || '',
        char: r.char_name || '',
        type: r.cp_type || 'Process',
        spec: r.spec || '',
        method: r.method || '',
        freq: r.freq || '',
        resp: r.resp || '',
        reaction: r.reaction || '',
        ctqIds: r.ctq_ids || []
      }));
    }

    // ── BOM ──────────────────────────────────────────────────
    if (!bomRes.error) {
      p.bom = { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] };
      (bomRes.data || []).forEach(r => {
        const type = r.bom_type;
        if (!p.bom[type]) return;
        p.bom[type].push({
          id: r.id,
          desc: r.item_desc || '',
          notes: r.notes || '',
          pn: r.pn || '',
          supplierPN: r.supplier_pn || '',
          qty: r.qty != null ? r.qty : 0,
          unit: r.unit || '',
          qtyPerUnit: r.qty_per_unit != null ? r.qty_per_unit : 0,
          isStd: r.is_std || false,
          isAaw: r.is_aaw || false,
          isRepair: r.is_repair || false,
          toolId: r.tool_id || '',
          spec: r.spec || '',
          equipId: r.equip_id || '',
          location: r.location || '',
          abcClass: r.abc_class || null,
          abcCatalogueId: r.abc_catalogue_id || null
        });
      });

      // BOM Kits
      if (!kitsRes.error && !kitItemsRes.error) {
        const bomTypeMap = {};
        (bomRes.data || []).forEach(r => { bomTypeMap[r.id] = r.bom_type; });
        p.bom.kits = (kitsRes.data || []).map(k => ({
          id: k.id,
          name: k.name || '',
          items: (kitItemsRes.data || [])
            .filter(ki => ki.kit_id === k.id)
            .map(ki => ({
              id: ki.id,
              bomType: bomTypeMap[ki.bom_item_id] || '',
              itemId: ki.bom_item_id,
              qty: ki.qty || 1
            }))
        }));
      }
    }

    // ── Gates ────────────────────────────────────────────────
    if (!gatesRes.error && !gateSigsRes.error) {
      // Start from GATE_DEFS defaults, then overlay DB data
      if (typeof GATE_DEFS !== 'undefined') {
        if (!p.gates || p.gates.length === 0) {
          p.gates = GATE_DEFS.map(g => ({
            gateNum: g.num,
            checks: g.items.map(() => false),
            sigs: g.signatories.map(r => ({ role: r, name: '', date: '', signed: false }))
          }));
        }
        (gatesRes.data || []).forEach(gr => {
          const g = p.gates[gr.gate_num];
          if (!g) return;
          g._dbId = gr.id;
          if (gr.checks && gr.checks.length === g.checks.length) {
            g.checks = gr.checks;
          }
        });
        (gateSigsRes.data || []).forEach(sig => {
          const gate = p.gates.find(g => g._dbId === sig.gate_id);
          if (!gate) return;
          const s = gate.sigs.find(x => x.role === sig.role);
          if (!s) return;
          s._id = sig.id;
          s.name = sig.sig_name || '';
          s.date = sig.sig_date || '';
          s.signed = sig.signed || false;
        });
      }
    }

    // ── Actions ──────────────────────────────────────────────
    if (!actionsRes.error) {
      p.actions = (actionsRes.data || []).map(r => ({
        id: r.id,
        desc: r.description || '',
        owner: r.owner || '',
        due: r.due_date || '',
        status: r.status || 'Open',
        priority: r.priority || 'Medium',
        source: r.source || 'General',
         notes: r.notes || '',
         subAsm: r.sub_assembly_id || ''
      }));
    }

    // ── Risks ────────────────────────────────────────────────
    if (!risksRes.error) {
      p.risks = (risksRes.data || []).map(r => ({
        id: r.id,
        desc: r.description || '',
        cat: r.category || 'Technical',
        owner: r.owner || '',
        lik: r.likelihood || 3,
        imp: r.impact || 3,
        mit: r.mitigation || '',
         status: r.status || 'Open',
         subAsm: r.sub_assembly_id || ''
      }));
    }

    // ── Gantt Rows ───────────────────────────────────────────
    if (!ganttRes.error) {
      p.gantt = (ganttRes.data || []).map(r => ({
        id: r.id,
        task: r.task || '',
        section: r.section || 's1',
        role: r.gantt_role || 'ME',
        planned: r.planned || [],
        actual: r.actual || [],
        notes: r.notes || '',
        collapsed: r.collapsed || false
      }));
    }

    // ── Documents ────────────────────────────────────────────
    if (!docsRes.error) {
      p.docs = (docsRes.data || []).map(r => ({
        id: r.id,
        docNumber: r.doc_number || '',
        title: r.doc_title || '',
        type: r.doc_type || 'Other',
        issue: r.issue_num || '',
        owner: r.owner || '',
        status: r.status || 'Draft',
        notes: r.notes || ''
      }));
    }

  } catch (err) {
    console.warn('npiRelLoad exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// CTQ
// ─────────────────────────────────────────────────────────────

window.npiRelSaveCTQ = async function(item) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!item || !item.id || !projectId || !currentUser) return;
  try {
    const { error } = await supa.from('npi_ctq').upsert({
      id: item.id,
      project_id: projectId,
      user_id: currentUser.id,
      sort_order: (prog().ctq || []).indexOf(item),
      req: item.req || '',
      spec: item.spec || '',
      test_method: item.testMethod || '',
      source: item.source || 'Customer Spec',
      oos_action: item.oos_action || 'TBD',
      customer_agreed: item.customerAgreed || false,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSaveCTQ error:', error.message);
  } catch (err) {
    console.warn('npiRelSaveCTQ exception:', err.message);
  }
};

window.npiRelDeleteCTQ = async function(id) {
  if (!id) return;
  try {
    const { error } = await supa.from('npi_ctq').delete().eq('id', id);
    if (error) console.warn('npiRelDeleteCTQ error:', error.message);
  } catch (err) {
    console.warn('npiRelDeleteCTQ exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// PFD Steps
// ─────────────────────────────────────────────────────────────

window.npiRelSavePFDStep = async function(step) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!step || !step.id || !projectId || !currentUser) return;
  try {
    const persistedStepNum = npiRelPersistedPfdStepNum(step, prog().pfd || []);
    const { error } = await supa.from('npi_pfd_steps').upsert({
      id: step.id,
      project_id: projectId,
      user_id: currentUser.id,
      step_num: persistedStepNum,
      step_type: step.type || 'step',
      op: step.op || '',
      detail: step.detail || '',
      ctq_ids: step.ctqIds || [],
      bom_refs: step.bomRefs || [],
      doc_refs: step.docRefs || [],
      pfd_type: npiRelIsHeaderStep(step.type) ? null : (step.pfd_type || 'Process'),
      next_step_num: npiRelIsHeaderStep(step.type) ? null : (step.nextStepId != null ? step.nextStepId : null),
      next_step_num_yes: npiRelIsHeaderStep(step.type) ? null : (step.nextStepId_yes != null ? step.nextStepId_yes : null),
      next_step_num_no: npiRelIsHeaderStep(step.type) ? null : (step.nextStepId_no != null ? step.nextStepId_no : null),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSavePFDStep error:', error.message);
  } catch (err) {
    console.warn('npiRelSavePFDStep exception:', err.message);
  }
};

window.npiRelDeletePFDStep = async function(id) {
  if (!id) return;
  try {
    const { error } = await supa.from('npi_pfd_steps').delete().eq('id', id);
    if (error) console.warn('npiRelDeletePFDStep error:', error.message);
  } catch (err) {
    console.warn('npiRelDeletePFDStep exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// PFMEA
// ─────────────────────────────────────────────────────────────

window.npiRelSavePFMEAMode = async function(mode) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!mode || !mode.id || !projectId || !currentUser) return;
  try {
    const { error } = await supa.from('npi_pfmea_modes').upsert({
      id: mode.id,
      project_id: projectId,
      user_id: currentUser.id,
      pfd_step_id: mode.pfdId || null,
      mode: mode.mode || '',
      ctq_ids: mode.ctqIds || [],
      sort_order: (prog().pfmea || []).indexOf(mode),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSavePFMEAMode error:', error.message);
  } catch (err) {
    console.warn('npiRelSavePFMEAMode exception:', err.message);
  }
};

window.npiRelSavePFMEAEffect = async function(modeId, effect) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!effect || !effect.id || !projectId || !currentUser) return;
  try {
    const mode = (prog().pfmea || []).find(m => m.id === modeId);
    const { error } = await supa.from('npi_pfmea_effects').upsert({
      id: effect.id,
      project_id: projectId,
      user_id: currentUser.id,
      mode_id: modeId,
      effect: effect.effect || '',
      sev: effect.sev || 1,
      sort_order: mode ? (mode.effects || []).indexOf(effect) : 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSavePFMEAEffect error:', error.message);
  } catch (err) {
    console.warn('npiRelSavePFMEAEffect exception:', err.message);
  }
};

window.npiRelSavePFMEACause = async function(effectId, cause) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!cause || !cause.id || !projectId || !currentUser) return;
  const act = cause.action || {};
  try {
    let effObj = null;
    let modeObj = null;
    for (const mode of (prog().pfmea || [])) {
      effObj = (mode.effects || []).find(e => e.id === effectId);
      if (effObj) {
        modeObj = mode;
        break;
      }
    }
    if (effObj && modeObj) {
      // Ensure parent row exists before inserting child row (effect_id FK).
      await window.npiRelSavePFMEAEffect(modeObj.id, effObj);
    }
    const { error } = await supa.from('npi_pfmea_causes').upsert({
      id: cause.id,
      project_id: projectId,
      user_id: currentUser.id,
      effect_id: effectId,
      cause: cause.cause || '',
      occ: cause.occ || 1,
      det: cause.det || 1,
      prevent: cause.prevent || '',
      detect: cause.detect || '',
      action_desc: act.desc || '',
      action_taken: act.taken || '',
      action_owner: act.owner || '',
      action_due: act.due || null,
      action_new_occ: (act.newOcc !== '' && act.newOcc != null) ? +act.newOcc : null,
      action_new_det: (act.newDet !== '' && act.newDet != null) ? +act.newDet : null,
      sort_order: effObj ? (effObj.causes || []).indexOf(cause) : 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSavePFMEACause error:', error.message);
  } catch (err) {
    console.warn('npiRelSavePFMEACause exception:', err.message);
  }
};

window.npiRelSavePFMEAHistory = async function(causeId, histEntry) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!histEntry || !causeId || !projectId || !currentUser) return;
  // History is append-only; assign a UUID if missing
  if (!histEntry.id) histEntry.id = crypto.randomUUID();
  try {
    const { error } = await supa.from('npi_pfmea_history').upsert({
      id: histEntry.id,
      project_id: projectId,
      user_id: currentUser.id,
      cause_id: causeId,
      rpn: histEntry.rpn,
      new_rpn: histEntry.newRpn,
      old_occ: histEntry.oldOcc != null ? histEntry.oldOcc : null,
      old_det: histEntry.oldDet != null ? histEntry.oldDet : null,
      new_occ: histEntry.newOcc != null ? histEntry.newOcc : null,
      new_det: histEntry.newDet != null ? histEntry.newDet : null,
      description: histEntry.desc || '',
      event_date: histEntry.date || ''
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSavePFMEAHistory error:', error.message);
  } catch (err) {
    console.warn('npiRelSavePFMEAHistory exception:', err.message);
  }
};

window.npiRelDeletePFMEAMode = async function(mode) {
  if (!mode || !mode.id) return;
  try {
    const causeIds = [];
    const effectIds = [];
    (mode.effects || []).forEach(ef => {
      effectIds.push(ef.id);
      (ef.causes || []).forEach(ca => causeIds.push(ca.id));
    });
    if (causeIds.length > 0) {
      await supa.from('npi_pfmea_history').delete().in('cause_id', causeIds);
      await supa.from('npi_pfmea_causes').delete().in('id', causeIds);
    }
    if (effectIds.length > 0) {
      await supa.from('npi_pfmea_effects').delete().in('id', effectIds);
    }
    const { error } = await supa.from('npi_pfmea_modes').delete().eq('id', mode.id);
    if (error) console.warn('npiRelDeletePFMEAMode error:', error.message);
  } catch (err) {
    console.warn('npiRelDeletePFMEAMode exception:', err.message);
  }
};

window.npiRelDeletePFMEAEffect = async function(effect) {
  if (!effect || !effect.id) return;
  try {
    const causeIds = (effect.causes || []).map(ca => ca.id);
    if (causeIds.length > 0) {
      await supa.from('npi_pfmea_history').delete().in('cause_id', causeIds);
      await supa.from('npi_pfmea_causes').delete().in('id', causeIds);
    }
    const { error } = await supa.from('npi_pfmea_effects').delete().eq('id', effect.id);
    if (error) console.warn('npiRelDeletePFMEAEffect error:', error.message);
  } catch (err) {
    console.warn('npiRelDeletePFMEAEffect exception:', err.message);
  }
};

window.npiRelDeletePFMEACause = async function(cause) {
  if (!cause || !cause.id) return;
  try {
    await supa.from('npi_pfmea_history').delete().eq('cause_id', cause.id);
    const { error } = await supa.from('npi_pfmea_causes').delete().eq('id', cause.id);
    if (error) console.warn('npiRelDeletePFMEACause error:', error.message);
  } catch (err) {
    console.warn('npiRelDeletePFMEACause exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// Control Plan
// ─────────────────────────────────────────────────────────────

window.npiRelSaveCP = async function(item) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!item || !item.id || !projectId || !currentUser) return;
  try {
    const { error } = await supa.from('npi_control_plan').upsert({
      id: item.id,
      project_id: projectId,
      user_id: currentUser.id,
      pfmea_mode_id: item.pfmeaId || null,
      pfmea_effect_id: item.pfmeaEffectId || null,
      pfmea_cause_id: item.pfmeaCauseId || null,
      pfd_step_id: item.pfdId || null,
      char_name: item.char || '',
      cp_type: item.type || 'Process',
      spec: item.spec || '',
      method: item.method || '',
      freq: item.freq || '',
      resp: item.resp || '',
      reaction: item.reaction || '',
      ctq_ids: item.ctqIds || [],
      sort_order: (prog().cp || []).indexOf(item),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSaveCP error:', error.message);
  } catch (err) {
    console.warn('npiRelSaveCP exception:', err.message);
  }
};

window.npiRelDeleteCP = async function(id) {
  if (!id) return;
  try {
    const { error } = await supa.from('npi_control_plan').delete().eq('id', id);
    if (error) console.warn('npiRelDeleteCP error:', error.message);
  } catch (err) {
    console.warn('npiRelDeleteCP exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// BOM Items
// ─────────────────────────────────────────────────────────────

window.npiRelSaveBOMItem = async function(type, item) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!item || !item.id || !projectId || !currentUser) return;
  try {
    const cleanItem = { ...item };
    delete cleanItem.supplier_pn;
    delete cleanItem.supplierPN;

    const payload = {
      id: item.id,
      project_id: projectId,
      user_id: currentUser.id,
      bom_type: type,
      item_desc: cleanItem.desc || '',
      notes: cleanItem.notes || '',
      pn: cleanItem.pn || null,
      qty: cleanItem.qty != null ? cleanItem.qty : null,
      unit: cleanItem.unit || null,
      qty_per_unit: cleanItem.qtyPerUnit != null ? cleanItem.qtyPerUnit : null,
      is_std: cleanItem.isStd || false,
      is_aaw: cleanItem.isAaw || false,
      is_repair: cleanItem.isRepair || false,
      tool_id: cleanItem.toolId || null,
      spec: cleanItem.spec || null,
      equip_id: cleanItem.equipId || null,
      location: cleanItem.location || null,
      abc_class: cleanItem.abcClass || null,
      abc_catalogue_id: cleanItem.abcCatalogueId || null,
      sort_order: (prog().bom[type] || []).indexOf(item),
      updated_at: new Date().toISOString()
    };

    const { error } = await supa.from('npi_bom_items').upsert(payload, { onConflict: 'id' });
    if (error) {
      if (error.message && error.message.includes('supplier_pn')) {
        console.warn('npiRelSaveBOMItem schema mismatch (supplier_pn). Ensure npi_bom_items does not reference legacy supplier_pn payloads.', error.message);
      } else {
        console.warn('npiRelSaveBOMItem error:', error.message);
      }
    }
  } catch (err) {
    console.warn('npiRelSaveBOMItem exception:', err.message);
  }
};

window.npiRelDeleteBOMItem = async function(id) {
  if (!id) return;
  try {
    // Kit items referencing this BOM item will also be deleted (or left as orphans — clean up too)
    await supa.from('npi_bom_kit_items').delete().eq('bom_item_id', id);
    const { error } = await supa.from('npi_bom_items').delete().eq('id', id);
    if (error) console.warn('npiRelDeleteBOMItem error:', error.message);
  } catch (err) {
    console.warn('npiRelDeleteBOMItem exception:', err.message);
  }
};

// ── ABC Catalogue (central source of truth) ───────────────────
window.npiRelFetchABCCatalogue = async function() {
  try {
    const { data, error } = await supa
      .from('abc_catalogue')
      .select('*')
      .order('item_desc');
    if (error) { console.warn('npiRelFetchABCCatalogue error:', error.message); return []; }
    return data || [];
  } catch (err) {
    console.warn('npiRelFetchABCCatalogue exception:', err.message);
    return [];
  }
};

window.npiRelSaveABCCatalogueEntry = async function(entry) {
  if (!entry || !entry.pn || !currentUser) return null;
  try {
    const { data, error } = await supa.from('abc_catalogue').upsert({
      id: entry.id || undefined,
      pn: entry.pn,
      item_desc: entry.item_desc || '',
      supplier_pn: entry.supplier_pn || null,
      unit: entry.unit || 'ea',
      notes: entry.notes || '',
      abc_class: entry.abc_class || 'C',
      in_sage: entry.in_sage || false,
      manufacturer: entry.manufacturer || null,
      manufacturer_pn: entry.manufacturer_pn || null,
      datasheet_url: entry.datasheet_url || null,
      user_id: currentUser.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select('*');
    if (error) { console.warn('npiRelSaveABCCatalogueEntry error:', error.message); return null; }
    return (data && data[0]) || null;
  } catch (err) {
    console.warn('npiRelSaveABCCatalogueEntry exception:', err.message);
    return null;
  }
};

window.npiRelDeleteABCCatalogueEntry = async function(id) {
  if (!id) return;
  try {
    const { error } = await supa.from('abc_catalogue').delete().eq('id', id);
    if (error) console.warn('npiRelDeleteABCCatalogueEntry error:', error.message);
  } catch (err) {
    console.warn('npiRelDeleteABCCatalogueEntry exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// BOM Kits
// ─────────────────────────────────────────────────────────────

window.npiRelSaveBOMKit = async function(kit) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!kit || !kit.id || !projectId || !currentUser) return;
  try {
    const { error } = await supa.from('npi_bom_kits').upsert({
      id: kit.id,
      project_id: projectId,
      user_id: currentUser.id,
      name: kit.name || '',
      sort_order: (prog().bom.kits || []).indexOf(kit),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSaveBOMKit error:', error.message);
  } catch (err) {
    console.warn('npiRelSaveBOMKit exception:', err.message);
  }
};

window.npiRelDeleteBOMKit = async function(id) {
  if (!id) return;
  try {
    await supa.from('npi_bom_kit_items').delete().eq('kit_id', id);
    const { error } = await supa.from('npi_bom_kits').delete().eq('id', id);
    if (error) console.warn('npiRelDeleteBOMKit error:', error.message);
  } catch (err) {
    console.warn('npiRelDeleteBOMKit exception:', err.message);
  }
};

// Save all kit items for a kit (delete-all then re-insert pattern)
window.npiRelSaveKitItems = async function(kit) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!kit || !kit.id || !projectId || !currentUser) return;
  try {
    await supa.from('npi_bom_kit_items').delete().eq('kit_id', kit.id);
    if (kit.items && kit.items.length > 0) {
      const rows = kit.items.map(item => {
        if (!item.id) item.id = crypto.randomUUID();
        return {
          id: item.id,
          project_id: projectId,
          user_id: currentUser.id,
          kit_id: kit.id,
          bom_item_id: item.itemId,
          qty: item.qty || 1
        };
      });
      const { error } = await supa.from('npi_bom_kit_items').insert(rows);
      if (error) console.warn('npiRelSaveKitItems insert error:', error.message);
    }
  } catch (err) {
    console.warn('npiRelSaveKitItems exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// Gates
// ─────────────────────────────────────────────────────────────

window.npiRelSaveGate = async function(gateNum) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!projectId || !currentUser) return;
  const p = prog();
  if (!p || !p.gates || !p.gates[gateNum]) return;
  const gate = p.gates[gateNum];
  try {
    if (gate._dbId) {
      const { error } = await supa.from('npi_gates')
        .update({ checks: gate.checks, updated_at: new Date().toISOString() })
        .eq('id', gate._dbId);
      if (error) console.warn('npiRelSaveGate update error:', error.message);
    } else {
      const { data, error } = await supa.from('npi_gates')
        .insert({
          project_id: projectId,
          user_id: currentUser.id,
          gate_num: gateNum,
          checks: gate.checks
        })
        .select('id');
      if (error) {
        console.warn('npiRelSaveGate insert error:', error.message);
      } else if (data && data[0]) {
        gate._dbId = data[0].id;
      }
    }
  } catch (err) {
    console.warn('npiRelSaveGate exception:', err.message);
  }
};

window.npiRelSaveGateSig = async function(gateNum, sigIdx) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!projectId || !currentUser) return;
  const p = prog();
  if (!p || !p.gates || !p.gates[gateNum]) return;
  const gate = p.gates[gateNum];
  if (!gate._dbId) {
    // Gate row must exist before we can save a sig
    await npiRelSaveGate(gateNum);
    if (!gate._dbId) return;
  }
  const sig = gate.sigs[sigIdx];
  if (!sig) return;
  try {
    const sigData = {
      project_id: projectId,
      user_id: currentUser.id,
      gate_id: gate._dbId,
      role: sig.role,
      sig_name: sig.name || '',
      sig_date: sig.date || null,
      signed: sig.signed || false
    };
    if (sig._id) {
      // Task 2-D: Conflict-safe gate signing.
      // Before saving a sign-off, check whether another user has already signed.
      if (sig.signed) {
        const { data: existing } = await supa
          .from('npi_gate_sigs')
          .select('signed, sig_name, sig_date')
          .eq('id', sig._id)
          .single();
        if (existing && existing.signed && existing.sig_name && String(existing.sig_name) !== String(sig.name || '')) {
          const signedDate = existing.sig_date ? ` on ${existing.sig_date}` : '';
          if (typeof showToast === 'function') {
            showToast(`Already signed by ${existing.sig_name}${signedDate}`, 'warning', 7000);
          }
          // Revert optimistic local update so the UI reflects reality
          sig.signed = false;
          sig.name   = existing.sig_name;
          sig.date   = existing.sig_date || sig.date;
          if (typeof npi !== 'undefined' && typeof npi.notify === 'function') npi.notify('render');
          return;
        }
      }
      const { error } = await supa.from('npi_gate_sigs')
        .update({ sig_name: sig.name || '', sig_date: sig.date || null, signed: sig.signed || false })
        .eq('id', sig._id);
      if (error) console.warn('npiRelSaveGateSig update error:', error.message);
    } else {
      const { data, error } = await supa.from('npi_gate_sigs')
        .insert(sigData)
        .select('id');
      if (error) {
        console.warn('npiRelSaveGateSig insert error:', error.message);
      } else if (data && data[0]) {
        sig._id = data[0].id;
      }
    }
  } catch (err) {
    console.warn('npiRelSaveGateSig exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────

window.npiRelSaveAction = async function(item) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!item || !item.id || !projectId || !currentUser) return;
  try {
    const { error } = await supa.from('npi_actions').upsert({
      id: item.id,
      project_id: projectId,
      user_id: currentUser.id,
      description: item.desc || '',
      owner: item.owner || '',
      due_date: item.due || null,
      status: item.status || 'Open',
      priority: item.priority || 'Medium',
      source: item.source || 'General',
      notes: item.notes || '',
      sub_assembly_id: item.subAsm || null,
      sort_order: (prog().actions || []).indexOf(item),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSaveAction error:', error.message);
  } catch (err) {
    console.warn('npiRelSaveAction exception:', err.message);
  }
};

window.npiRelDeleteAction = async function(id) {
  if (!id) return;
  try {
    const { error } = await supa.from('npi_actions').delete().eq('id', id);
    if (error) console.warn('npiRelDeleteAction error:', error.message);
  } catch (err) {
    console.warn('npiRelDeleteAction exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// Risks
// ─────────────────────────────────────────────────────────────

window.npiRelSaveRisk = async function(item) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!item || !item.id || !projectId || !currentUser) return;
  try {
    const { error } = await supa.from('npi_risks').upsert({
      id: item.id,
      project_id: projectId,
      user_id: currentUser.id,
      description: item.desc || '',
      category: item.cat || 'Technical',
      owner: item.owner || '',
      likelihood: item.lik || 3,
      impact: item.imp || 3,
      mitigation: item.mit || '',
      status: item.status || 'Open',
      sub_assembly_id: item.subAsm || null,
      sort_order: (prog().risks || []).indexOf(item),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSaveRisk error:', error.message);
  } catch (err) {
    console.warn('npiRelSaveRisk exception:', err.message);
  }
};

window.npiRelDeleteRisk = async function(id) {
  if (!id) return;
  try {
    const { error } = await supa.from('npi_risks').delete().eq('id', id);
    if (error) console.warn('npiRelDeleteRisk error:', error.message);
  } catch (err) {
    console.warn('npiRelDeleteRisk exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// Gantt Rows
// ─────────────────────────────────────────────────────────────

window.npiRelSaveGanttRow = async function(row) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!row || !row.id || !projectId || !currentUser) return;
  try {
    const { error } = await supa.from('npi_gantt_rows').upsert({
      id: row.id,
      project_id: projectId,
      user_id: currentUser.id,
      task: row.task || '',
      section: row.section || 's1',
      gantt_role: row.role || 'ME',
      planned: row.planned || [],
      actual: row.actual || [],
      notes: row.notes || '',
      collapsed: row.collapsed || false,
      sort_order: (prog().gantt || []).indexOf(row),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSaveGanttRow error:', error.message);
  } catch (err) {
    console.warn('npiRelSaveGanttRow exception:', err.message);
  }
};

window.npiRelDeleteGanttRow = async function(id) {
  if (!id) return;
  try {
    const { error } = await supa.from('npi_gantt_rows').delete().eq('id', id);
    if (error) console.warn('npiRelDeleteGanttRow error:', error.message);
  } catch (err) {
    console.warn('npiRelDeleteGanttRow exception:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────
// Clear all NPI relational data for a project (for testing and cascade delete)
// ─────────────────────────────────────────────────────────────

window.npiRelClearAll = async function(pid) {
  const projectId = await window.npiRelResolveProjectId(pid);
  if (!projectId) return;
  const tables = [
    'npi_pfmea_history', 'npi_pfmea_causes', 'npi_pfmea_effects', 'npi_pfmea_modes',
    'npi_control_plan', 'npi_bom_kit_items', 'npi_bom_kits', 'npi_bom_items',
    'npi_gate_sigs', 'npi_gates', 'npi_gantt_rows', 'npi_actions', 'npi_risks',
    'npi_pfd_steps', 'npi_ctq', 'npi_documents'
  ];
  for (const table of tables) {
    await supa.from(table).delete().eq('project_id', projectId);
  }
};

// Task 2-C: Public alias used by deleteProject() to cascade-delete NPI relational data
window.npiRelDeleteAllForProject = window.npiRelClearAll;

// ─────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────

window.npiRelSaveDoc = async function(item) {
  const projectId = await window.npiRelResolveProjectId(progId);
  if (!item || !item.id || !projectId || !currentUser) return;
  try {
    const { error } = await supa.from('npi_documents').upsert({
      id: item.id,
      project_id: projectId,
      user_id: currentUser.id,
      doc_number: item.docNumber || '',
      doc_title: item.title || '',
      doc_type: item.type || 'Other',
      issue_num: item.issue || '',
      owner: item.owner || '',
      status: item.status || 'Draft',
      notes: item.notes || '',
      sort_order: (prog().docs || []).indexOf(item),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('npiRelSaveDoc error:', error.message);
  } catch (err) {
    console.warn('npiRelSaveDoc exception:', err.message);
  }
};

window.npiRelDeleteDoc = async function(id) {
  if (!id) return;
  try {
    const { error } = await supa.from('npi_documents').delete().eq('id', id);
    if (error) console.warn('npiRelDeleteDoc error:', error.message);
  } catch (err) {
    console.warn('npiRelDeleteDoc exception:', err.message);
  }
};
