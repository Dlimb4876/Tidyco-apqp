/**
 * feedback-constants.test.js — Tests for portals/feedback/js/feedback-constants.js
 *
 * Covers: FEEDBACK_TYPES, FEEDBACK_STATUS, FEEDBACK_PRIORITY enums,
 *         getFeedbackTypeConfig, getFeedbackStatusConfig, getFeedbackPriorityConfig
 */

import {
  FEEDBACK_TYPES,
  FEEDBACK_STATUS,
  FEEDBACK_PRIORITY,
  FEEDBACK_TYPE_CONFIG,
  FEEDBACK_STATUS_CONFIG,
  FEEDBACK_PRIORITY_CONFIG,
  getFeedbackTypeConfig,
  getFeedbackStatusConfig,
  getFeedbackPriorityConfig
} from '../portals/feedback/js/feedback-constants.js';

describe('FEEDBACK_TYPES', () => {
  it('defines all expected type keys', () => {
    expect(FEEDBACK_TYPES.BUG).toBe('bug');
    expect(FEEDBACK_TYPES.USABILITY).toBe('usability');
    expect(FEEDBACK_TYPES.FEATURE_REQUEST).toBe('feature_request');
    expect(FEEDBACK_TYPES.IMPROVEMENT).toBe('improvement');
  });
});

describe('FEEDBACK_STATUS', () => {
  it('defines all expected status keys', () => {
    const S = FEEDBACK_STATUS;
    expect(S.OPEN).toBe('open');
    expect(S.IN_REVIEW).toBe('in_review');
    expect(S.PLANNED).toBe('planned');
    expect(S.IN_PROGRESS).toBe('in_progress');
    expect(S.COMPLETED).toBe('completed');
    expect(S.DECLINED).toBe('declined');
    expect(S.SQUASHED).toBe('squashed');
  });

  it('marks closed statuses correctly', () => {
    const cfg = FEEDBACK_STATUS_CONFIG;
    expect(cfg['open'].isClosed).toBe(false);
    expect(cfg['in_review'].isClosed).toBe(false);
    expect(cfg['planned'].isClosed).toBe(false);
    expect(cfg['in_progress'].isClosed).toBe(false);
    expect(cfg['completed'].isClosed).toBe(true);
    expect(cfg['declined'].isClosed).toBe(true);
    expect(cfg['squashed'].isClosed).toBe(true);
  });
});

describe('FEEDBACK_PRIORITY', () => {
  it('defines all expected priority keys', () => {
    expect(FEEDBACK_PRIORITY.LOW).toBe('low');
    expect(FEEDBACK_PRIORITY.MEDIUM).toBe('medium');
    expect(FEEDBACK_PRIORITY.HIGH).toBe('high');
  });
});

describe('Config helpers', () => {
  it('getFeedbackTypeConfig returns correct config', () => {
    const cfg = getFeedbackTypeConfig('bug');
    expect(cfg).toBeDefined();
    expect(cfg.label).toContain('Bug');
  });

  it('getFeedbackStatusConfig returns correct config', () => {
    const cfg = getFeedbackStatusConfig('open');
    expect(cfg).toBeDefined();
    expect(cfg.label).toBe('OPEN');
  });

  it('getFeedbackPriorityConfig returns correct config', () => {
    const cfg = getFeedbackPriorityConfig('high');
    expect(cfg).toBeDefined();
    expect(cfg.label).toBe('High');
  });

  it('handles unknown keys gracefully', () => {
    expect(getFeedbackTypeConfig('unknown').label).toBe('Usability Feedback');
    expect(getFeedbackStatusConfig('unknown').label).toBe('OPEN');
    expect(getFeedbackPriorityConfig('unknown').label).toBe('Medium');
  });
});

describe('Module exports', () => {
  it('exports all constants', () => {
    expect(FEEDBACK_TYPES).toBeDefined();
    expect(FEEDBACK_STATUS).toBeDefined();
    expect(FEEDBACK_PRIORITY).toBeDefined();
    expect(FEEDBACK_TYPE_CONFIG).toBeDefined();
    expect(FEEDBACK_STATUS_CONFIG).toBeDefined();
    expect(FEEDBACK_PRIORITY_CONFIG).toBeDefined();
  });

  it('exports helper functions', () => {
    expect(typeof getFeedbackTypeConfig).toBe('function');
    expect(typeof getFeedbackStatusConfig).toBe('function');
    expect(typeof getFeedbackPriorityConfig).toBe('function');
  });
});
