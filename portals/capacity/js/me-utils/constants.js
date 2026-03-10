// ME Capacity Planning - Constants and Configuration

export const ME_TASK_CATEGORIES = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];

export const ME_CATEGORY_COLORS = {
  npi: '#3b82f6',           // blue
  improvement: '#10b981',   // green
  tendering: '#f59e0b',     // amber
  support: '#14b8a6',       // teal
  other: '#8b5cf6'          // purple
};

export const ME_CATEGORY_CLASS = {
  npi: 'cat-npi',
  improvement: 'cat-improvement',
  tendering: 'cat-tendering',
  support: 'cat-support',
  other: 'cat-other'
};

export const ME_DEFAULTS = {
  TEAM: { hoursPerWeek: 37.5, utilisation: 80 },
  TASK: { category: 'NPI', durationDays: 30, hours: 40 },
  PRODUCT: { durationDays: 365, hoursPerWeek: 5 }
};

export const UK_BANK_HOLIDAYS_FIXED = {
  '01-01': 'New Year',
  '12-25': 'Christmas',
  '12-26': 'Boxing Day'
};

export const CHART_COLORS = {
  capacity: '#ef4444',      // red (team capacity line)
  npi: '#3b82f6',
  improvement: '#10b981',
  tendering: '#f59e0b',
  support: '#14b8a6',
  other: '#8b5cf6'
};

export const CHART_CONFIG = {
  months: 18,
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false }
};
