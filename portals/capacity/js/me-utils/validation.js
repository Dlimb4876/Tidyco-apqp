// ME Capacity Planning - Input Validation

/**
 * Validate team member input
 * @param {string} name
 * @param {number} hoursPerWeek
 * @param {number} utilisation
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateTeam(name, hoursPerWeek, utilisation) {
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  const hours = parseFloat(hoursPerWeek);
  if (isNaN(hours) || hours <= 0 || hours > 60) {
    errors.push('Hours per week must be between 0 and 60');
  }

  const util = parseFloat(utilisation);
  if (isNaN(util) || util < 0 || util > 100) {
    errors.push('Utilisation must be between 0 and 100%');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate task input
 * @param {string} name
 * @param {string} category
 * @param {string} assigneeId
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 * @param {number} totalHours
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateTask(name, category, assigneeId, startDate, endDate, totalHours) {
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Task name is required');
  }

  if (!category || category.trim().length === 0) {
    errors.push('Category is required');
  }

  if (!startDate || !validateDate(startDate)) {
    errors.push('Start date must be in YYYY-MM-DD format');
  }

  if (!endDate || !validateDate(endDate)) {
    errors.push('End date must be in YYYY-MM-DD format');
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push('End date must be after start date');
  }

  const hours = parseFloat(totalHours);
  if (isNaN(hours) || hours < 0) {
    errors.push('Total hours must be a positive number');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate product input
 * @param {string} name
 * @param {string} supportFrom YYYY-MM-DD
 * @param {string} supportUntil YYYY-MM-DD
 * @param {number} hoursPerWeek
 * @param {string} notes
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateProduct(name, supportFrom, supportUntil, hoursPerWeek, notes) {
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Product name is required');
  }

  if (!supportFrom || !validateDate(supportFrom)) {
    errors.push('Support from date must be in YYYY-MM-DD format');
  }

  if (!supportUntil || !validateDate(supportUntil)) {
    errors.push('Support until date must be in YYYY-MM-DD format');
  }

  if (supportFrom && supportUntil && new Date(supportFrom) > new Date(supportUntil)) {
    errors.push('Support until date must be after support from date');
  }

  const hours = parseFloat(hoursPerWeek);
  if (isNaN(hours) || hours < 0 || hours > 168) {
    errors.push('Hours per week must be between 0 and 168');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate date string format
 * @param {string} dateStr YYYY-MM-DD format
 * @returns {boolean}
 */
export function validateDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(date.getTime());
}

/**
 * Get user-friendly validation error message
 * @param {string} field
 * @param {string|number} value
 * @returns {string}
 */
export function getValidationError(field, value) {
  if (!value) return `${field} is required`;
  return `Invalid ${field}`;
}
