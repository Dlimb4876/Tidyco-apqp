/* ============================================================
   feedback-constants.js — Feedback System Constants
   Defines feedback types, statuses, icons, and labels
   ============================================================ */

window.FEEDBACK_TYPES = {
  BUG: 'bug',
  USABILITY: 'usability',
  FEATURE_REQUEST: 'feature_request',
  IMPROVEMENT: 'improvement'
};

window.FEEDBACK_TYPE_CONFIG = {
  [window.FEEDBACK_TYPES.BUG]: {
    label: 'Bug Report',
    icon: '🐛',
    badgeColor: 'var(--red)',
    rowClass: 'feedback-row-bug',
    description: 'Report a technical issue or error'
  },
  [window.FEEDBACK_TYPES.USABILITY]: {
    label: 'Usability Feedback',
    icon: '💡',
    badgeColor: 'var(--blue)',
    rowClass: 'feedback-row-usability',
    description: 'Suggest UX or workflow improvements'
  },
  [window.FEEDBACK_TYPES.FEATURE_REQUEST]: {
    label: 'Feature Request',
    icon: '✨',
    badgeColor: 'var(--purple)',
    rowClass: 'feedback-row-feature',
    description: 'Request a new feature or capability'
  },
  [window.FEEDBACK_TYPES.IMPROVEMENT]: {
    label: 'Improvement',
    icon: '🔧',
    badgeColor: 'var(--green)',
    rowClass: 'feedback-row-improvement',
    description: 'Suggest enhancement to existing features'
  }
};

window.FEEDBACK_STATUS = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DECLINED: 'declined',
  SQUASHED: 'squashed'
};

window.FEEDBACK_STATUS_CONFIG = {
  [window.FEEDBACK_STATUS.OPEN]: {
    label: 'OPEN',
    badgeClass: 'feedback-badge-open',
    isClosed: false
  },
  [window.FEEDBACK_STATUS.IN_REVIEW]: {
    label: 'IN REVIEW',
    badgeClass: 'feedback-badge-in-review',
    isClosed: false
  },
  [window.FEEDBACK_STATUS.PLANNED]: {
    label: 'PLANNED',
    badgeClass: 'feedback-badge-planned',
    isClosed: false
  },
  [window.FEEDBACK_STATUS.IN_PROGRESS]: {
    label: 'IN PROGRESS',
    badgeClass: 'feedback-badge-in-progress',
    isClosed: false
  },
  [window.FEEDBACK_STATUS.COMPLETED]: {
    label: 'COMPLETED',
    badgeClass: 'feedback-badge-completed',
    isClosed: true
  },
  [window.FEEDBACK_STATUS.DECLINED]: {
    label: 'DECLINED',
    badgeClass: 'feedback-badge-declined',
    isClosed: true
  },
  [window.FEEDBACK_STATUS.SQUASHED]: {
    label: 'SQUASHED',
    badgeClass: 'feedback-badge-squashed',
    isClosed: true
  }
};

window.FEEDBACK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

window.FEEDBACK_PRIORITY_CONFIG = {
  [window.FEEDBACK_PRIORITY.LOW]: {
    label: 'Low',
    color: 'var(--grey)'
  },
  [window.FEEDBACK_PRIORITY.MEDIUM]: {
    label: 'Medium',
    color: 'var(--blue)'
  },
  [window.FEEDBACK_PRIORITY.HIGH]: {
    label: 'High',
    color: 'var(--red)'
  }
};

// Helper function to get type config
window.getFeedbackTypeConfig = function(type) {
  return window.FEEDBACK_TYPE_CONFIG[type] || window.FEEDBACK_TYPE_CONFIG[window.FEEDBACK_TYPES.USABILITY];
};

// Helper function to get status config
window.getFeedbackStatusConfig = function(status) {
  return window.FEEDBACK_STATUS_CONFIG[status] || window.FEEDBACK_STATUS_CONFIG[window.FEEDBACK_STATUS.OPEN];
};

// Helper function to get priority config
window.getFeedbackPriorityConfig = function(priority) {
  return window.FEEDBACK_PRIORITY_CONFIG[priority] || window.FEEDBACK_PRIORITY_CONFIG[window.FEEDBACK_PRIORITY.MEDIUM];
};
