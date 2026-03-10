// Team member CRUD operations

import { validateTeam } from '../me-utils/validation.js';

/**
 * Add a new team member
 * @param {Array} teamArray
 * @param {string} name
 * @param {number} hoursPerWeek
 * @param {number} utilisation
 */
export function meTeamAdd(teamArray, name, hoursPerWeek, utilisation) {
  const { isValid, errors } = validateTeam(name, hoursPerWeek, utilisation);
  if (!isValid) {
    console.warn('Validation errors:', errors);
    return false;
  }

  const member = {
    id: meUUID(),
    name: name.trim(),
    hoursPerWeek: parseFloat(hoursPerWeek),
    utilisation: parseFloat(utilisation),
    jobTitle: ''
  };

  teamArray.push(member);
  return true;
}

/**
 * Update a team member field
 * @param {Array} teamArray
 * @param {number} idx
 * @param {string} field
 * @param {any} value
 */
export function meTeamUpdate(teamArray, idx, field, value) {
  if (idx < 0 || idx >= teamArray.length) return false;

  const member = teamArray[idx];

  switch (field) {
    case 'name':
      member.name = value.trim();
      break;
    case 'hoursPerWeek':
      member.hoursPerWeek = parseFloat(value) || 37.5;
      break;
    case 'utilisation':
      member.utilisation = parseFloat(value) || 80;
      break;
    case 'jobTitle':
      member.jobTitle = value ? value.trim() : '';
      break;
    default:
      return false;
  }

  return true;
}

/**
 * Delete a team member
 * @param {Array} teamArray
 * @param {number} idx
 */
export function meTeamDelete(teamArray, idx) {
  if (idx < 0 || idx >= teamArray.length) return false;
  teamArray.splice(idx, 1);
  return true;
}

/**
 * Get total team capacity (hours per week)
 * @param {Array} teamArray
 * @returns {number}
 */
export function meTeamGetCapacity(teamArray) {
  return teamArray.reduce((total, member) => {
    const hoursPerWeek = member.hoursPerWeek || 37.5;
    const utilisation = (member.utilisation || 80) / 100;
    return total + hoursPerWeek * utilisation;
  }, 0);
}

/**
 * Generate UUID or fallback
 * @returns {string}
 */
function meUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
