// Task CRUD operations

import { validateTask } from '../me-utils/validation.js';
import { ME_DEFAULTS, ME_TASK_CATEGORIES } from '../me-utils/constants.js';

/**
 * Add a new task
 * @param {Array} tasksArray
 * @param {string} name
 * @param {string} category
 * @param {string} assigneeId Team member ID
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 * @param {number} totalHours
 */
export function meTaskAdd(tasksArray, name, category, assigneeId, startDate, endDate, totalHours) {
  const { isValid, errors } = validateTask(name, category, assigneeId, startDate, endDate, totalHours);
  if (!isValid) {
    console.warn('Validation errors:', errors);
    return false;
  }

  const task = {
    id: meUUID(),
    name: name.trim(),
    category: category || ME_DEFAULTS.TASK.category,
    assigneeId: assigneeId || '',
    startDate: startDate,
    endDate: endDate,
    totalHours: parseFloat(totalHours) || 0,
    createdAt: new Date().toISOString()
  };

  tasksArray.push(task);
  return true;
}

/**
 * Update a task field
 * @param {Array} tasksArray
 * @param {number} idx
 * @param {string} field
 * @param {any} value
 */
export function meTaskUpdate(tasksArray, idx, field, value) {
  if (idx < 0 || idx >= tasksArray.length) return false;

  const task = tasksArray[idx];

  switch (field) {
    case 'name':
      task.name = value.trim();
      break;
    case 'category':
      if (ME_TASK_CATEGORIES.includes(value)) {
        task.category = value;
      }
      break;
    case 'assigneeId':
      task.assigneeId = value || '';
      break;
    case 'startDate':
      task.startDate = value;
      break;
    case 'endDate':
      task.endDate = value;
      break;
    case 'totalHours':
      task.totalHours = parseFloat(value) || 0;
      break;
    default:
      return false;
  }

  return true;
}

/**
 * Delete a task
 * @param {Array} tasksArray
 * @param {number} idx
 */
export function meTaskDelete(tasksArray, idx) {
  if (idx < 0 || idx >= tasksArray.length) return false;
  tasksArray.splice(idx, 1);
  return true;
}

/**
 * Get total hours across all tasks
 * @param {Array} tasksArray
 * @returns {number}
 */
export function meTaskGetTotalHours(tasksArray) {
  return tasksArray.reduce((total, task) => total + (task.totalHours || 0), 0);
}

/**
 * Get tasks by category
 * @param {Array} tasksArray
 * @param {string} category
 * @returns {Array}
 */
export function meTaskGetByCategory(tasksArray, category) {
  return tasksArray.filter(task => task.category === category);
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
