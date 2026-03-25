// Families Data Layer
// Manages product families with Supabase persistence
// Collaborative: all users see the same data, changes sync in real-time

let familiesState = {
  families: [],
  loading: false,
  error: null,
  subscription: null
};

// Initialize families from Supabase with real-time subscription
async function familiesDataInit() {
  familiesState.loading = true;
  familiesState.error = null;

  try {
    // Load initial data
    await familiesDataLoad();

    // Set up real-time subscription for collaborative editing
    if (typeof createRealtimeSubscription === 'function') {
      const reloadAndRender = async () => {
        await familiesDataLoad();
        if (typeof renderSettingsFamiliesTab === 'function') renderSettingsFamiliesTab();
      };
      familiesState.subscription = createRealtimeSubscription(
        'families',
        'families_changed',
        {
          onInsert: reloadAndRender,
          onUpdate: reloadAndRender,
          onDelete: reloadAndRender
        }
      );
    }

    familiesState.loading = false;
    return familiesState.families;
  } catch (err) {
    console.error('Error initializing families:', err);
    familiesState.error = err.message;
    familiesState.loading = false;
    return [];
  }
}

// Load families from Supabase
async function familiesDataLoad() {
  try {
    const { data, error } = await supa.from('families')
      .select('*')
      .order('label', { ascending: true });

    if (error) throw error;

    familiesState.families = data || [];
    return familiesState.families;
  } catch (err) {
    console.error('Error loading families:', err);
    familiesState.error = err.message;
    throw err;
  }
}

// Cleanup function for real-time subscription
function familiesDataCleanup() {
  if (familiesState.subscription && typeof removeRealtimeSubscription === 'function') {
    removeRealtimeSubscription(familiesState.subscription);
    familiesState.subscription = null;
  }
}

// Add a new family
window.familiesDataAddFamily = async function(name, label, icon, description) {
  if (!name || !label) return null;

  const family = {
    user_id: currentUser.id,
    name: name.trim(),
    label: label.trim(),
    icon: icon || '📋',
    description: description ? description.trim() : null
  };

  try {
    const { data, error } = await supa.from('families')
      .insert([family])
      .select();

    if (error) throw error;

    if (data && data[0]) {
      const newFamily = data[0];
      familiesState.families.push(newFamily);
      familiesState.families.sort((a, b) => a.label.localeCompare(b.label));

      if (typeof familyTemplatesEnsureDefaultForFamily === 'function') {
        await familyTemplatesEnsureDefaultForFamily(newFamily);
      }

      return newFamily;
    }
  } catch (err) {
    console.error('Error adding family:', err);
    showToast('Failed to add family: ' + err.message, 'error');
  }
  return null;
};

// Update a family
window.familiesDataUpdateFamily = async function(familyId, updates) {
  const family = familiesState.families.find(f => f.id === familyId);
  if (!family) return false;

  try {
    const { error } = await supa.from('families')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', familyId);

    if (error) throw error;

    // Update local state
    Object.assign(family, updates);
    familiesState.families.sort((a, b) => a.label.localeCompare(b.label));
    return true;
  } catch (err) {
    console.error('Error updating family:', err);
    showToast('Failed to update family: ' + err.message, 'error');
  }
  return false;
};

// Delete a family
window.familiesDataDeleteFamily = async function(familyId) {
  const idx = familiesState.families.findIndex(f => f.id === familyId);
  if (idx === -1) return false;

  try {
    const { error } = await supa.from('families')
      .delete()
      .eq('id', familyId);

    if (error) throw error;

    familiesState.families.splice(idx, 1);
    return true;
  } catch (err) {
    console.error('Error deleting family:', err);
    showToast('Failed to delete family: ' + err.message, 'error');
  }
  return false;
};

// Get family by ID
window.familiesDataGetFamily = function(familyId) {
  return familiesState.families.find(f => f.id === familyId);
};

// Get family label by ID
window.familiesDataGetFamilyLabel = function(familyId) {
  const family = familiesState.families.find(f => f.id === familyId);
  return family ? family.label : 'Unknown';
};

// Get all families
window.familiesDataGetAll = function() {
  return [...familiesState.families];
};
