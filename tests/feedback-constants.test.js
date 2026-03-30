import { jest } from '@jest/globals'

const {
  FEEDBACK_TYPES,
  FEEDBACK_STATUS,
  FEEDBACK_PRIORITY,
  FEEDBACK_TYPE_CONFIG,
  FEEDBACK_STATUS_CONFIG,
  FEEDBACK_PRIORITY_CONFIG,
  getFeedbackTypeConfig,
  getFeedbackStatusConfig,
  getFeedbackPriorityConfig
} = await import('../portals/feedback/js/feedback-constants.js')

describe('FEEDBACK_TYPES', () => {
  it('should define feedback type constants', () => {
    expect(FEEDBACK_TYPES.BUG).toBe('bug')
    expect(FEEDBACK_TYPES.USABILITY).toBe('usability')
    expect(FEEDBACK_TYPES.FEATURE_REQUEST).toBe('feature_request')
    expect(FEEDBACK_TYPES.IMPROVEMENT).toBe('improvement')
  })
})

describe('FEEDBACK_STATUS', () => {
  it('should define status constants', () => {
    expect(FEEDBACK_STATUS.OPEN).toBe('open')
    expect(FEEDBACK_STATUS.IN_REVIEW).toBe('in_review')
    expect(FEEDBACK_STATUS.PLANNED).toBe('planned')
    expect(FEEDBACK_STATUS.IN_PROGRESS).toBe('in_progress')
    expect(FEEDBACK_STATUS.COMPLETED).toBe('completed')
    expect(FEEDBACK_STATUS.DECLINED).toBe('declined')
    expect(FEEDBACK_STATUS.SQUASHED).toBe('squashed')
  })

  it('should mark closed statuses correctly', () => {
    expect(FEEDBACK_STATUS_CONFIG.open.isClosed).toBe(false)
    expect(FEEDBACK_STATUS_CONFIG.in_review.isClosed).toBe(false)
    expect(FEEDBACK_STATUS_CONFIG.planned.isClosed).toBe(false)
    expect(FEEDBACK_STATUS_CONFIG.in_progress.isClosed).toBe(false)
    expect(FEEDBACK_STATUS_CONFIG.completed.isClosed).toBe(true)
    expect(FEEDBACK_STATUS_CONFIG.declined.isClosed).toBe(true)
    expect(FEEDBACK_STATUS_CONFIG.squashed.isClosed).toBe(true)
  })
})

describe('FEEDBACK_PRIORITY', () => {
  it('should define priority constants', () => {
    expect(FEEDBACK_PRIORITY.LOW).toBe('low')
    expect(FEEDBACK_PRIORITY.MEDIUM).toBe('medium')
    expect(FEEDBACK_PRIORITY.HIGH).toBe('high')
  })
})

describe('Config getter functions', () => {
  it('getFeedbackTypeConfig should return config for valid type', () => {
    const config = getFeedbackTypeConfig('bug')
    expect(config).toBeDefined()
    expect(config).toHaveProperty('label')
  })

  it('getFeedbackStatusConfig should return config for valid status', () => {
    const config = getFeedbackStatusConfig('open')
    expect(config).toBeDefined()
    expect(config).toHaveProperty('label')
    expect(config).toHaveProperty('isClosed')
  })

  it('getFeedbackPriorityConfig should return config for valid priority', () => {
    const config = getFeedbackPriorityConfig('high')
    expect(config).toBeDefined()
    expect(config).toHaveProperty('label')
  })
})
