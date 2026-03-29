/**
 * feedback-data.test.js — Tests for portals/feedback/js/feedback-data.js
 *
 * Covers: feedbackDataManager state management (getFilteredFeedback,
 *         setFilter, setTab, setEditingId, subscribe, unsubscribe),
 *         feedbackDataUnsubscribe wrapper
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.currentUser = { id: 'user-1', email: 'test@test.com' };

global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    insert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [{ id: 'new-1' }], error: null }),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ data: [{ id: 'upd-1' }], error: null }),
      })),
    })),
  })),
};

global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();

// Load module
await import('../portals/feedback/js/feedback-data.js');

// ─────────────────────────────────────────────────────────────
// Sample feedback data
// ─────────────────────────────────────────────────────────────

const SAMPLE_FEEDBACK = [
  { id: '1', feedback_type: 'bug',             status: 'open',      title: 'Crash on load',    description: 'App crashes',      page_area: 'dashboard', submitted_by: 'alice@test.com' },
  { id: '2', feedback_type: 'feature_request', status: 'planned',   title: 'Dark mode',        description: 'Add dark mode',    page_area: 'settings',  submitted_by: 'bob@test.com' },
  { id: '3', feedback_type: 'usability',       status: 'open',      title: 'Confusing layout', description: 'Hard to navigate', page_area: 'capacity',  submitted_by: 'alice@test.com' },
  { id: '4', feedback_type: 'improvement',     status: 'completed', title: 'Better exports',   description: 'Improve CSV',      page_area: 'hub',       submitted_by: 'carol@test.com' },
];

beforeEach(() => {
  // Reset state before each test
  window.feedbackDataManager.state.feedback = [...SAMPLE_FEEDBACK];
  window.feedbackDataManager.state.filter = { type: 'all', status: 'all', search: '' };
  window.feedbackDataManager.state.tab = 'submit';
  window.feedbackDataManager.state.editingId = null;
  jest.clearAllMocks();
});

describe('feedbackDataManager.getFilteredFeedback()', () => {
  it('returns all items when no filters are set', () => {
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(4);
  });

  it('filters by feedback type', () => {
    window.feedbackDataManager.state.filter.type = 'bug';
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Crash on load');
  });

  it('filters by status', () => {
    window.feedbackDataManager.state.filter.status = 'open';
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(2);
    result.forEach(item => expect(item.status).toBe('open'));
  });

  it('filters by search term matching title', () => {
    window.feedbackDataManager.state.filter.search = 'dark';
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Dark mode');
  });

  it('filters by search term matching description', () => {
    window.feedbackDataManager.state.filter.search = 'CSV';
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('filters by search term matching page_area', () => {
    window.feedbackDataManager.state.filter.search = 'capacity';
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('filters by search term matching submitted_by', () => {
    window.feedbackDataManager.state.filter.search = 'carol';
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('returns empty array when no items match combined filters', () => {
    window.feedbackDataManager.state.filter.type = 'bug';
    window.feedbackDataManager.state.filter.status = 'completed';
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(0);
  });

  it('is case-insensitive for search', () => {
    window.feedbackDataManager.state.filter.search = 'CRASH';
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns empty array when feedback list is empty', () => {
    window.feedbackDataManager.state.feedback = [];
    const result = window.feedbackDataManager.getFilteredFeedback();
    expect(result).toHaveLength(0);
  });
});

describe('feedbackDataManager.setFilter()', () => {
  it('updates the specified filter key', () => {
    window.feedbackDataManager.setFilter('type', 'bug');
    expect(window.feedbackDataManager.state.filter.type).toBe('bug');
  });

  it('dispatches feedbackDataChanged event', () => {
    const handler = jest.fn();
    document.addEventListener('feedbackDataChanged', handler);
    window.feedbackDataManager.setFilter('status', 'open');
    document.removeEventListener('feedbackDataChanged', handler);
    expect(handler).toHaveBeenCalled();
  });
});

describe('feedbackDataManager.setTab()', () => {
  it('updates tab state', () => {
    window.feedbackDataManager.setTab('list');
    expect(window.feedbackDataManager.state.tab).toBe('list');
  });

  it('dispatches feedbackDataChanged event', () => {
    const handler = jest.fn();
    document.addEventListener('feedbackDataChanged', handler);
    window.feedbackDataManager.setTab('submit');
    document.removeEventListener('feedbackDataChanged', handler);
    expect(handler).toHaveBeenCalled();
  });
});

describe('feedbackDataManager.setEditingId()', () => {
  it('sets the editing ID', () => {
    window.feedbackDataManager.setEditingId('item-42');
    expect(window.feedbackDataManager.state.editingId).toBe('item-42');
  });

  it('clears the editing ID when set to null', () => {
    window.feedbackDataManager.state.editingId = 'something';
    window.feedbackDataManager.setEditingId(null);
    expect(window.feedbackDataManager.state.editingId).toBeNull();
  });
});

describe('feedbackDataManager.subscribe()', () => {
  it('calls createRealtimeSubscription with the correct channel', () => {
    window.feedbackDataManager.subscribe();
    expect(global.createRealtimeSubscription).toHaveBeenCalledWith(
      'user_feedback',
      'user_feedback_channel',
      expect.objectContaining({ onInsert: expect.any(Function), onUpdate: expect.any(Function), onDelete: expect.any(Function) })
    );
  });

  it('onInsert callback adds new feedback to state', () => {
    window.feedbackDataManager.subscribe();
    const { onInsert } = global.createRealtimeSubscription.mock.calls[0][2];
    const newItem = { id: '99', title: 'New bug', status: 'open' };
    onInsert(newItem);
    expect(window.feedbackDataManager.state.feedback[0]).toEqual(newItem);
  });

  it('onInsert does not add duplicate items', () => {
    window.feedbackDataManager.subscribe();
    const { onInsert } = global.createRealtimeSubscription.mock.calls[0][2];
    onInsert(SAMPLE_FEEDBACK[0]); // already exists
    expect(window.feedbackDataManager.state.feedback.filter(f => f.id === '1')).toHaveLength(1);
  });

  it('onUpdate callback updates existing item in state', () => {
    window.feedbackDataManager.subscribe();
    const { onUpdate } = global.createRealtimeSubscription.mock.calls[0][2];
    const updated = { ...SAMPLE_FEEDBACK[0], status: 'in_review' };
    onUpdate(updated);
    expect(window.feedbackDataManager.state.feedback.find(f => f.id === '1').status).toBe('in_review');
  });

  it('onDelete callback removes item from state', () => {
    window.feedbackDataManager.subscribe();
    const { onDelete } = global.createRealtimeSubscription.mock.calls[0][2];
    onDelete({ id: '1' });
    expect(window.feedbackDataManager.state.feedback.find(f => f.id === '1')).toBeUndefined();
  });
});

describe('feedbackDataManager.unsubscribe()', () => {
  it('calls removeRealtimeSubscription with correct channel', () => {
    window.feedbackDataManager.unsubscribe();
    expect(global.removeRealtimeSubscription).toHaveBeenCalledWith('user_feedback_channel');
  });
});

describe('feedbackDataUnsubscribe()', () => {
  it('delegates to feedbackDataManager.unsubscribe', () => {
    const spy = jest.spyOn(window.feedbackDataManager, 'unsubscribe');
    feedbackDataUnsubscribe(); // eslint-disable-line no-undef
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('feedbackDataManager.init()', () => {
  it('exits early and does not call supa when currentUser is null', async () => {
    global.currentUser = null;
    await window.feedbackDataManager.init();
    expect(global.supa.from).not.toHaveBeenCalled();
    global.currentUser = { id: 'user-1', email: 'test@test.com' };
  });

  it('loads feedback and calls subscribe on success', async () => {
    const data = [{ id: 'f1', title: 'Feedback 1', status: 'open' }];
    global.supa.from = jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({ data, error: null }),
      })),
    }));
    const subscribeSpy = jest.spyOn(window.feedbackDataManager, 'subscribe').mockImplementation(() => {});

    await window.feedbackDataManager.init();

    expect(window.feedbackDataManager.state.feedback).toEqual(data);
    expect(subscribeSpy).toHaveBeenCalled();
    subscribeSpy.mockRestore();
  });

  it('sets feedback to empty array on load error', async () => {
    global.supa.from = jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      })),
    }));

    await expect(window.feedbackDataManager.init()).rejects.toThrow('Could not load user feedback.');
    expect(window.feedbackDataManager.state.feedback).toEqual([]);
  });
});
