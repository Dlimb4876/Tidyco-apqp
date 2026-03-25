// Family PFMEA Templates Data Layer
// Manages PFMEA templates per product family with Supabase persistence

let familyTemplatesState = {
  templates: [],
  loading: false,
  error: null
};

const DEFAULT_FAMILY_TEMPLATE_NAME = 'Standard Family PFMEA';
const DEFAULT_FAMILY_FAILURE_MODE = 'Define key family failure mode';

function sortFamilyTemplatesState() {
  familyTemplatesState.templates.sort((a, b) => {
    const familyCompare = String(a.family_id || '').localeCompare(String(b.family_id || ''));
    if (familyCompare !== 0) return familyCompare;
    const nameCompare = String(a.template_name || '').localeCompare(String(b.template_name || ''));
    if (nameCompare !== 0) return nameCompare;
    return String(a.failure_mode || '').localeCompare(String(b.failure_mode || ''));
  });
}

function buildDefaultFamilyTemplateItem(familyId, familyLabel) {
  return {
    user_id: currentUser.id,
    family_id: familyId,
    template_name: DEFAULT_FAMILY_TEMPLATE_NAME,
    failure_mode: DEFAULT_FAMILY_FAILURE_MODE,
    effect: familyLabel ? 'Initial PFMEA template for ' + familyLabel : 'Initial PFMEA template',
    severity: 3,
    cause: null,
    occurrence: 3,
    prevention_control: null,
    detection_control: null,
    detection: 3,
    notes: 'Auto-created when product family is added'
  };
}

window.familyTemplatesEnsureDefaultForFamily = async function(family) {
  if (!family || !family.id || !currentUser?.id) return false;

  const hasTemplate = familyTemplatesState.templates.some(t => t.family_id === family.id);
  if (hasTemplate) return false;

  try {
    const item = buildDefaultFamilyTemplateItem(family.id, family.label);
    const { data, error } = await supa.from('family_pfmea_templates')
      .upsert([item], {
        onConflict: 'user_id,family_id,template_name,failure_mode',
        ignoreDuplicates: true
      })
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      familyTemplatesState.templates.push(...data);
      sortFamilyTemplatesState();
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error creating default family template:', err);
    showToast('Family added, but default template setup failed: ' + err.message, 'warning');
    return false;
  }
};

async function familyTemplatesBackfillMissingFamilies() {
  if (!currentUser?.id || !familiesState?.families?.length) return;

  const familiesWithTemplates = new Set(
    familyTemplatesState.templates.map(t => t.family_id)
  );
  const missingFamilies = familiesState.families
    .filter(family => family?.id && !familiesWithTemplates.has(family.id));

  if (missingFamilies.length === 0) return;

  try {
    const defaults = missingFamilies.map(family =>
      buildDefaultFamilyTemplateItem(family.id, family.label)
    );

    const { data, error } = await supa.from('family_pfmea_templates')
      .upsert(defaults, {
        onConflict: 'user_id,family_id,template_name,failure_mode',
        ignoreDuplicates: true
      })
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      familyTemplatesState.templates.push(...data);
      sortFamilyTemplatesState();
      showToast('Backfilled default templates for ' + data.length + ' product family(s)', 'success');
    }
  } catch (err) {
    console.error('Error backfilling missing family templates:', err);
    showToast('Failed to backfill family templates: ' + err.message, 'warning');
  }
}

// Initialize templates from Supabase
async function familyTemplatesDataInit() {
  familyTemplatesState.loading = true;
  familyTemplatesState.error = null;

  try {
    const { data, error } = await supa.from('family_pfmea_templates')
      .select('*')
      .order('family_id,template_name', { ascending: true });

    if (error) throw error;

    familyTemplatesState.templates = data || [];
    await familyTemplatesBackfillMissingFamilies();
    sortFamilyTemplatesState();
    familyTemplatesState.loading = false;
    familyTemplatesDataSubscribe();
    return familyTemplatesState.templates;
  } catch (err) {
    console.error('Error loading family templates:', err);
    familyTemplatesState.error = err.message;
    familyTemplatesState.loading = false;
    return [];
  }
}

// Get all templates for a specific family
window.familyTemplatesGetByFamily = function(familyId) {
  return familyTemplatesState.templates.filter(t => t.family_id === familyId);
};

// Get grouped templates for a family (grouped by template name)
window.familyTemplatesGetGroupedByFamily = function(familyId) {
  const templates = familyTemplatesGetByFamily(familyId);
  const grouped = {};

  templates.forEach(t => {
    if (!grouped[t.template_name]) {
      grouped[t.template_name] = [];
    }
    grouped[t.template_name].push(t);
  });

  return grouped;
};

// Add a template item (single PFMEA row for a family)
window.familyTemplatesAddItem = async function(familyId, templateName, failureMode, effect, severity, cause, occurrence, preventionControl, detectionControl, detection, notes) {
  if (!familyId || !templateName || !failureMode) return null;

  const item = {
    user_id: currentUser.id,
    family_id: familyId,
    template_name: templateName.trim(),
    failure_mode: failureMode.trim(),
    effect: effect?.trim() || null,
    severity: severity || 3,
    cause: cause?.trim() || null,
    occurrence: occurrence || 3,
    prevention_control: preventionControl?.trim() || null,
    detection_control: detectionControl?.trim() || null,
    detection: detection || 3,
    notes: notes?.trim() || null
  };

  try {
    const { data, error } = await supa.from('family_pfmea_templates')
      .insert([item])
      .select();

    if (error) throw error;

    if (data && data[0]) {
      familyTemplatesState.templates.push(data[0]);
      return data[0];
    }
  } catch (err) {
    console.error('Error adding template item:', err);
    showToast('Failed to add template: ' + err.message, 'error');
  }
  return null;
};

// Update a template item
window.familyTemplatesUpdateItem = async function(itemId, updates) {
  const item = familyTemplatesState.templates.find(t => t.id === itemId);
  if (!item) return false;

  try {
    const { error } = await supa.from('family_pfmea_templates')
      .update(updates)
      .eq('id', itemId);

    if (error) throw error;

    Object.assign(item, updates);
    return true;
  } catch (err) {
    console.error('Error updating template item:', err);
    showToast('Failed to update template: ' + err.message, 'error');
  }
  return false;
};

// Delete a template item
window.familyTemplatesDeleteItem = async function(itemId) {
  const idx = familyTemplatesState.templates.findIndex(t => t.id === itemId);
  if (idx === -1) return false;

  try {
    const { error } = await supa.from('family_pfmea_templates')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    familyTemplatesState.templates.splice(idx, 1);
    return true;
  } catch (err) {
    console.error('Error deleting template item:', err);
    showToast('Failed to delete template: ' + err.message, 'error');
  }
  return false;
};

// Delete entire template for a family
window.familyTemplatesDeleteFamily = async function(familyId, templateName) {
  const itemsToDelete = familyTemplatesState.templates
    .filter(t => t.family_id === familyId && t.template_name === templateName)
    .map(t => t.id);

  if (itemsToDelete.length === 0) return false;

  try {
    const { error } = await supa.from('family_pfmea_templates')
      .delete()
      .in('id', itemsToDelete);

    if (error) throw error;

    familyTemplatesState.templates = familyTemplatesState.templates
      .filter(t => !itemsToDelete.includes(t.id));

    return true;
  } catch (err) {
    console.error('Error deleting family template:', err);
    showToast('Failed to delete template: ' + err.message, 'error');
  }
  return false;
};

// Copy template from one family to another (or create new version)
window.familyTemplatesCopyTemplate = async function(sourceFamilyId, sourceTemplateName, targetFamilyId, newTemplateName) {
  const items = familyTemplatesGetByFamily(sourceFamilyId)
    .filter(t => t.template_name === sourceTemplateName);

  if (items.length === 0) return false;

  try {
    const newItems = items.map(item => ({
      user_id: currentUser.id,
      family_id: targetFamilyId,
      template_name: newTemplateName,
      failure_mode: item.failure_mode,
      effect: item.effect,
      severity: item.severity,
      cause: item.cause,
      occurrence: item.occurrence,
      prevention_control: item.prevention_control,
      detection_control: item.detection_control,
      detection: item.detection,
      notes: item.notes
    }));

    const { data, error } = await supa.from('family_pfmea_templates')
      .insert(newItems)
      .select();

    if (error) throw error;

    if (data) {
      familyTemplatesState.templates.push(...data);
      return true;
    }
  } catch (err) {
    console.error('Error copying template:', err);
    showToast('Failed to copy template: ' + err.message, 'error');
  }
  return false;
};

// Apply template to a project PFMEA (returns array of PFMEA objects)
window.familyTemplatesApplyToProject = function(familyId, templateName) {
  const items = familyTemplatesGetByFamily(familyId)
    .filter(t => t.template_name === templateName);

  return items.map(item => ({
    mode: item.failure_mode,
    effect: item.effect || '',
    sev: item.severity || 3,
    cause: item.cause || '',
    occ: item.occurrence || 3,
    prevent: item.prevention_control || '',
    detect: item.detection_control || '',
    det: item.detection || 3,
    actions: [],
    notes: item.notes || ''
  }));
};

// ── Real-time subscription ───────────────────────────────────────
function familyTemplatesDataSubscribe() {
  createRealtimeSubscription('family_pfmea_templates', 'family_templates_channel', {
    onInsert: (record) => {
      familyTemplatesState.templates.push(record);
      sortFamilyTemplatesState();
      // Patch the viewer tbody if it's showing this template
      if (typeof templateViewerState !== 'undefined' &&
          templateViewerState.isOpen &&
          templateViewerState.familyId === record.family_id &&
          templateViewerState.templateName === record.template_name &&
          typeof familyTemplateViewerRowHTML === 'function') {
        realtimePatchInsert('#tmpl-viewer-tbody', familyTemplateViewerRowHTML(record));
      } else if (typeof templateManagerState !== 'undefined' && templateManagerState.isOpen &&
                 templateManagerState.familyId === record.family_id) {
        // Template manager shows groups — re-render only if this family's manager is open
        render();
      }
    },
    onUpdate: (record) => {
      const idx = familyTemplatesState.templates.findIndex(t => t.id === record.id);
      if (idx >= 0) familyTemplatesState.templates[idx] = record;
      if (typeof templateViewerState !== 'undefined' &&
          templateViewerState.isOpen &&
          templateViewerState.familyId === record.family_id &&
          templateViewerState.templateName === record.template_name &&
          typeof familyTemplateViewerRowHTML === 'function') {
        realtimePatchUpdate('#tmpl-viewer-tbody', record.id, familyTemplateViewerRowHTML(record));
      }
    },
    onDelete: (record) => {
      familyTemplatesState.templates = familyTemplatesState.templates.filter(t => t.id !== record.id);
      realtimePatchDelete('#tmpl-viewer-tbody', record.id);
    }
  });
}

window.familyTemplatesDataUnsubscribe = function() {
  removeRealtimeSubscription('family_templates_channel');
};

// Get template statistics
window.familyTemplatesGetStats = function(familyId) {
  const items = familyTemplatesGetByFamily(familyId);
  const templates = new Set(items.map(t => t.template_name));
  const avgRPN = items.length > 0
    ? items.reduce((sum, t) => sum + (t.severity * t.occurrence * t.detection), 0) / items.length
    : 0;

  return {
    templateCount: templates.size,
    itemCount: items.length,
    averageRPN: Math.round(avgRPN * 10) / 10,
    templateNames: Array.from(templates)
  };
};
