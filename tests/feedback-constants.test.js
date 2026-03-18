/**
 * feedback-constants.test.js — Tests for portals/feedback/js/feedback-constants.js
 *
 * Covers: FEEDBACK_TYPES, FEEDBACK_STATUS, FEEDBACK_PRIORITY enums,
 *         getFeedbackTypeConfig, getFeedbackStatusConfig, getFeedbackPriorityConfig
 */

const fs = require('fs');
const path = require('path');

// Load the module under test (uses window.* assignments)
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/feedback/js/feedback-constants.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

describe('FEEDBACK_TYPES', () => {
  it('defines all expected type keys', () => {
    expect(window.FEEDBACK_TYPES.BUG).toBe('bug');
    expect(window.FEEDBACK_TYPES.USABILITY).toBe('usability');
    expect(window.FEEDBACK_TYPES.FEATURE_REQUEST).toBe('feature_request');
    expect(window.FEEDBACK_TYPES.IMPROVEMENT).toBe('improvement');
  });
});

describe('FEEDBACK_STATUS', () => {
  it('defines all expected status keys', () => {
    const S = window.FEEDBACK_STATUS;
    expect(S.OPEN).toBe('open');
    expect(S.IN_REVIEW).toBe('in_review');
    expect(S.PLANNED).toBe('planned');
    expect(S.IN_PROGRESS).toBe('in_progress');
    expect(S.COMPLETED).toBe('completed');
    expect(S.DECLINED).toBe('declined');
    expect(S.SQUASHED).toBe('squashed');
  });

  it('marks closed statuses correctly', () => {
    const cfg = window.FEEDBACK_STATUS_CONFIG;
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
  it('defines low, medium, high', () => {
    const P = window.FEEDBACK_PRIORITY;
    expect(P.LOW).toBe('low');
    expect(P.MEDIUM).toBe('medium');
    expect(P.HIGH).toBe('high');
  });
});

describe('getFeedbackTypeConfig()', () => {
  it('returns correct config for known type', () => {
    const cfg = window.getFeedbackTypeConfig('bug');
    expect(cfg.label).toBe('Bug Report');
    expect(cfg.rowClass).toBe('feedback-row-bug');
  });

  it('returns correct config for feature_request', () => {
    const cfg = window.getFeedbackTypeConfig('feature_request');
    expect(cfg.label).toBe('Feature Request');
  });

  it('returns usability config as default for unknown type', () => {
    const cfg = window.getFeedbackTypeConfig('unknown_type');
    expect(cfg.label).toBe('Usability Feedback');
  });

  it('returns usability config for undefined input', () => {
    const cfg = window.getFeedbackTypeConfig(undefined);
    expect(cfg.label).toBe('Usability Feedback');
  });
});

describe('getFeedbackStatusConfig()', () => {
  it('returns correct config for open status', () => {
    const cfg = window.getFeedbackStatusConfig('open');
    expect(cfg.label).toBe('OPEN');
    expect(cfg.isClosed).toBe(false);
  });

  it('returns correct config for completed status', () => {
    const cfg = window.getFeedbackStatusConfig('completed');
    expect(cfg.label).toBe('COMPLETED');
    expect(cfg.isClosed).toBe(true);
  });

  it('returns open config as default for unknown status', () => {
    const cfg = window.getFeedbackStatusConfig('invalid');
    expect(cfg.label).toBe('OPEN');
  });
});

describe('getFeedbackPriorityConfig()', () => {
  it('returns correct config for high priority', () => {
    const cfg = window.getFeedbackPriorityConfig('high');
    expect(cfg.label).toBe('High');
  });

  it('returns correct config for low priority', () => {
    const cfg = window.getFeedbackPriorityConfig('low');
    expect(cfg.label).toBe('Low');
  });

  it('returns medium config as default for unknown priority', () => {
    const cfg = window.getFeedbackPriorityConfig('unknown');
    expect(cfg.label).toBe('Medium');
  });
});
