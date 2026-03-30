/* ============================================================
   feedback-constants.js — Feedback System Constants
   Defines feedback types, statuses, icons, and labels
   ============================================================ */

export const FEEDBACK_TYPES = {
  BUG: 'bug',
  USABILITY: 'usability',
  FEATURE_REQUEST: 'feature_request',
  IMPROVEMENT: 'improvement'
}

export const FEEDBACK_TYPE_CONFIG = {
  [FEEDBACK_TYPES.BUG]: {
    label: 'Bug Report',
    icon: '🐛',
    badgeColor: 'var(--red)',
    rowClass: 'feedback-row-bug',
    description: 'Report a technical issue or error'
  },
  [FEEDBACK_TYPES.USABILITY]: {
    label: 'Usability Feedback',
    icon: '💡',
    badgeColor: 'var(--blue)',
    rowClass: 'feedback-row-usability',
    description: 'Suggest UX or workflow improvements'
  },
  [FEEDBACK_TYPES.FEATURE_REQUEST]: {
    label: 'Feature Request',
    icon: '✨',
    badgeColor: 'var(--purple)',
    rowClass: 'feedback-row-feature',
    description: 'Request a new feature or capability'
  },
  [FEEDBACK_TYPES.IMPROVEMENT]: {
    label: 'Improvement',
    icon: '🔧',
    badgeColor: 'var(--green)',
    rowClass: 'feedback-row-improvement',
    description: 'Suggest enhancement to existing features'
  }
}

export const FEEDBACK_STATUS = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DECLINED: 'declined',
  SQUASHED: 'squashed'
}

export const FEEDBACK_STATUS_CONFIG = {
  [FEEDBACK_STATUS.OPEN]: {
    label: 'OPEN',
    badgeClass: 'feedback-badge-open',
    isClosed: false
  },
  [FEEDBACK_STATUS.IN_REVIEW]: {
    label: 'IN REVIEW',
    badgeClass: 'feedback-badge-in-review',
    isClosed: false
  },
  [FEEDBACK_STATUS.PLANNED]: {
    label: 'PLANNED',
    badgeClass: 'feedback-badge-planned',
    isClosed: false
  },
  [FEEDBACK_STATUS.IN_PROGRESS]: {
    label: 'IN PROGRESS',
    badgeClass: 'feedback-badge-in-progress',
    isClosed: false
  },
  [FEEDBACK_STATUS.COMPLETED]: {
    label: 'COMPLETED',
    badgeClass: 'feedback-badge-completed',
    isClosed: true
  },
  [FEEDBACK_STATUS.DECLINED]: {
    label: 'DECLINED',
    badgeClass: 'feedback-badge-declined',
    isClosed: true
  },
  [FEEDBACK_STATUS.SQUASHED]: {
    label: 'SQUASHED',
    badgeClass: 'feedback-badge-squashed',
    isClosed: true
  }
}

export const FEEDBACK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
}

export const FEEDBACK_PRIORITY_CONFIG = {
  [FEEDBACK_PRIORITY.LOW]: {
    label: 'Low',
    color: 'var(--grey)'
  },
  [FEEDBACK_PRIORITY.MEDIUM]: {
    label: 'Medium',
    color: 'var(--blue)'
  },
  [FEEDBACK_PRIORITY.HIGH]: {
    label: 'High',
    color: 'var(--red)'
  }
}

export function getFeedbackTypeConfig(type) {
  return FEEDBACK_TYPE_CONFIG[type] || FEEDBACK_TYPE_CONFIG[FEEDBACK_TYPES.USABILITY]
}

export function getFeedbackStatusConfig(status) {
  return FEEDBACK_STATUS_CONFIG[status] || FEEDBACK_STATUS_CONFIG[FEEDBACK_STATUS.OPEN]
}

export function getFeedbackPriorityConfig(priority) {
  return FEEDBACK_PRIORITY_CONFIG[priority] || FEEDBACK_PRIORITY_CONFIG[FEEDBACK_PRIORITY.MEDIUM]
}
