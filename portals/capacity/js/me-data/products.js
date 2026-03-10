// Product CRUD operations

import { validateProduct } from '../me-utils/validation.js';
import { ME_DEFAULTS } from '../me-utils/constants.js';

/**
 * Add a new product
 * @param {Array} productsArray
 * @param {string} name
 * @param {string} supportFrom YYYY-MM-DD
 * @param {string} supportUntil YYYY-MM-DD
 * @param {number} hoursPerWeek
 * @param {string} notes
 */
export function meProductAdd(productsArray, name, supportFrom, supportUntil, hoursPerWeek, notes) {
  const { isValid, errors } = validateProduct(name, supportFrom, supportUntil, hoursPerWeek, notes);
  if (!isValid) {
    console.warn('Validation errors:', errors);
    return false;
  }

  const product = {
    id: meUUID(),
    name: name.trim(),
    supportFrom: supportFrom,
    supportUntil: supportUntil,
    hoursPerWeek: parseFloat(hoursPerWeek) || ME_DEFAULTS.PRODUCT.hoursPerWeek,
    notes: notes ? notes.trim() : '',
    createdAt: new Date().toISOString()
  };

  productsArray.push(product);
  return true;
}

/**
 * Update a product field
 * @param {Array} productsArray
 * @param {number} idx
 * @param {string} field
 * @param {any} value
 */
export function meProductUpdate(productsArray, idx, field, value) {
  if (idx < 0 || idx >= productsArray.length) return false;

  const product = productsArray[idx];

  switch (field) {
    case 'name':
      product.name = value.trim();
      break;
    case 'supportFrom':
      product.supportFrom = value;
      break;
    case 'supportUntil':
      product.supportUntil = value;
      break;
    case 'hoursPerWeek':
      product.hoursPerWeek = parseFloat(value) || 0;
      break;
    case 'notes':
      product.notes = value ? value.trim() : '';
      break;
    default:
      return false;
  }

  return true;
}

/**
 * Delete a product
 * @param {Array} productsArray
 * @param {number} idx
 */
export function meProductDelete(productsArray, idx) {
  if (idx < 0 || idx >= productsArray.length) return false;
  productsArray.splice(idx, 1);
  return true;
}

/**
 * Get total support load (hours per week)
 * @param {Array} productsArray
 * @returns {number}
 */
export function meProductGetTotalLoad(productsArray) {
  return productsArray.reduce((total, product) => total + (product.hoursPerWeek || 0), 0);
}

/**
 * Get products active during a date range
 * @param {Array} productsArray
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array}
 */
export function meProductGetActive(productsArray, startDate, endDate) {
  return productsArray.filter(product => {
    const prodStart = new Date(product.supportFrom);
    const prodEnd = new Date(product.supportUntil);
    return prodStart <= endDate && prodEnd >= startDate;
  });
}

/**
 * Generate UUID or fallback
 * @returns {string}
 */
function meUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
