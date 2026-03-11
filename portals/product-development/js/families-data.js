// Families Data Layer
// Manages product families with Supabase persistence

let familiesState = {
  families: [],
  loading: false,
  error: null
};

// Initialize families from Supabase
async function familiesDataInit() {
  familiesState.loading = true;
  familiesState.error = null;

  try {
    const { data, error } = await supa.from('families')
      .select('*')
      .order('label', { ascending: true });

    if (error) throw error;

    familiesState.families = data || [];
    familiesState.loading = false;
    return familiesState.families;
  } catch (err) {
    console.error('Error loading families:', err);
    familiesState.error = err.message;
    familiesState.loading = false;
    return [];
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
      familiesState.families.push(data[0]);
      familiesState.families.sort((a, b) => a.label.localeCompare(b.label));
      render();
      return data[0];
    }
  } catch (err) {
    console.error('Error adding family:', err);
    alert('Failed to add family: ' + err.message);
  }
  return null;
};

// Update a family
window.familiesDataUpdateFamily = async function(familyId, updates) {
  const family = familiesState.families.find(f => f.id === familyId);
  if (!family) return false;

  try {
    const { error } = await supa.from('families')
      .update(updates)
      .eq('id', familyId);

    if (error) throw error;

    Object.assign(family, updates);
    familiesState.families.sort((a, b) => a.label.localeCompare(b.label));
    render();
    return true;
  } catch (err) {
    console.error('Error updating family:', err);
    alert('Failed to update family: ' + err.message);
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
    render();
    return true;
  } catch (err) {
    console.error('Error deleting family:', err);
    alert('Failed to delete family: ' + err.message);
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
