/**
 * realtime.test.js — Tests for utils/js/realtime.js
 *
 * Covers: createRealtimeSubscription, removeRealtimeSubscription,
 *         removeRealtimeSubscriptionsMatching, getActiveRealtimeSubscriptions,
 *         createMultiTableRealtimeSubscription
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toEvalFriendlyModuleSource } from './helpers/esm-eval.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────
// Mock Supabase client — set up before eval so supa is available
// ─────────────────────────────────────────────────────────────

let mockChannelRef;

const makeMockChannel = () => ({
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(), // returns the channel object as the subscription handle
});

global.supa = {
  channel: jest.fn(() => mockChannelRef),
  removeChannel: jest.fn(),
};

// ─────────────────────────────────────────────────────────────
// Load the module ONCE at module level so function declarations become globals
// ─────────────────────────────────────────────────────────────

const src = fs.readFileSync(
  path.resolve(__dirname, '../utils/js/realtime.js'),
  'utf8'
);
eval(toEvalFriendlyModuleSource(src)); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Reset subscription registry and mocks before each test
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  mockChannelRef = makeMockChannel();

  global.supa = {
    channel: jest.fn(() => mockChannelRef),
    removeChannel: jest.fn(),
  };

  // Clear the live subscription registry using the module's own cleanup function
  removeRealtimeSubscriptionsMatching(/.*/); // eslint-disable-line no-undef
});

describe('createRealtimeSubscription', () => {
  it('returns null when tableName is missing', () => {
    const result = createRealtimeSubscription('', 'chan1', {}); // eslint-disable-line no-undef
    expect(result).toBeNull();
  });

  it('returns null when channelName is missing', () => {
    const result = createRealtimeSubscription('my_table', '', {}); // eslint-disable-line no-undef
    expect(result).toBeNull();
  });

  it('creates a subscription and stores it', () => {
    const result = createRealtimeSubscription('my_table', 'chan1', {}); // eslint-disable-line no-undef
    expect(result).not.toBeNull();
    expect(global.supa.channel).toHaveBeenCalledWith('chan1');
    expect(getActiveRealtimeSubscriptions()).toContain('chan1'); // eslint-disable-line no-undef
  });

  it('returns existing subscription if channel already active', () => {
    const first = createRealtimeSubscription('my_table', 'chan1', {}); // eslint-disable-line no-undef
    const second = createRealtimeSubscription('my_table', 'chan1', {}); // eslint-disable-line no-undef
    expect(first).toBe(second);
    expect(global.supa.channel).toHaveBeenCalledTimes(1);
  });

  it('fires onInsert callback for INSERT events', () => {
    const onInsert = jest.fn();
    createRealtimeSubscription('my_table', 'chan_ins', { onInsert }); // eslint-disable-line no-undef

    // Simulate the postgres_changes callback
    const onCall = mockChannelRef.on.mock.calls[0];
    const payloadHandler = onCall[2];
    payloadHandler({ eventType: 'INSERT', new: { id: 1 } });

    expect(onInsert).toHaveBeenCalledWith({ id: 1 });
  });

  it('fires onUpdate callback for UPDATE events', () => {
    const onUpdate = jest.fn();
    createRealtimeSubscription('my_table', 'chan_upd', { onUpdate }); // eslint-disable-line no-undef

    const payloadHandler = mockChannelRef.on.mock.calls[0][2];
    payloadHandler({ eventType: 'UPDATE', new: { id: 2, name: 'updated' } });

    expect(onUpdate).toHaveBeenCalledWith({ id: 2, name: 'updated' });
  });

  it('fires onDelete callback for DELETE events', () => {
    const onDelete = jest.fn();
    createRealtimeSubscription('my_table', 'chan_del', { onDelete }); // eslint-disable-line no-undef

    const payloadHandler = mockChannelRef.on.mock.calls[0][2];
    payloadHandler({ eventType: 'DELETE', old: { id: 3 } });

    expect(onDelete).toHaveBeenCalledWith({ id: 3 });
  });

  it('does not fire INSERT if not in events list', () => {
    const onInsert = jest.fn();
    createRealtimeSubscription('my_table', 'chan_no_ins', { onInsert }, { events: ['UPDATE', 'DELETE'] }); // eslint-disable-line no-undef

    const payloadHandler = mockChannelRef.on.mock.calls[0][2];
    payloadHandler({ eventType: 'INSERT', new: { id: 1 } });

    expect(onInsert).not.toHaveBeenCalled();
  });

  it('passes filter option to channel.on', () => {
    createRealtimeSubscription('my_table', 'chan_filter', {}, { filter: 'user_id=eq.123' }); // eslint-disable-line no-undef

    const onArgs = mockChannelRef.on.mock.calls[0][1];
    expect(onArgs.filter).toBe('user_id=eq.123');
  });

  it('returns null and does not throw when supa.channel throws', () => {
    global.supa.channel = jest.fn(() => { throw new Error('channel error'); });
    const result = createRealtimeSubscription('my_table', 'chan_err', {}); // eslint-disable-line no-undef
    expect(result).toBeNull();
  });
});

describe('removeRealtimeSubscription', () => {
  it('removes a previously created subscription', () => {
    createRealtimeSubscription('my_table', 'chan_to_remove', {}); // eslint-disable-line no-undef
    expect(getActiveRealtimeSubscriptions()).toContain('chan_to_remove'); // eslint-disable-line no-undef

    removeRealtimeSubscription('chan_to_remove'); // eslint-disable-line no-undef
    expect(getActiveRealtimeSubscriptions()).not.toContain('chan_to_remove'); // eslint-disable-line no-undef
    expect(global.supa.removeChannel).toHaveBeenCalled();
  });

  it('does nothing for an unknown channel name', () => {
    removeRealtimeSubscription('nonexistent_chan'); // eslint-disable-line no-undef
    expect(global.supa.removeChannel).not.toHaveBeenCalled();
  });

  it('does nothing when channelName is falsy', () => {
    removeRealtimeSubscription(null); // eslint-disable-line no-undef
    removeRealtimeSubscription(''); // eslint-disable-line no-undef
    expect(global.supa.removeChannel).not.toHaveBeenCalled();
  });

  it('does not throw when supa.removeChannel throws', () => {
    createRealtimeSubscription('my_table', 'chan_throw', {}); // eslint-disable-line no-undef
    global.supa.removeChannel = jest.fn(() => { throw new Error('remove error'); });
    expect(() => removeRealtimeSubscription('chan_throw')).not.toThrow(); // eslint-disable-line no-undef
  });
});

describe('removeRealtimeSubscriptionsMatching', () => {
  it('removes channels matching a string pattern', () => {
    createRealtimeSubscription('t1', 'me_team_channel', {}); // eslint-disable-line no-undef
    createRealtimeSubscription('t2', 'me_tasks_channel', {}); // eslint-disable-line no-undef
    createRealtimeSubscription('t3', 'prod_channel', {}); // eslint-disable-line no-undef

    removeRealtimeSubscriptionsMatching('me_'); // eslint-disable-line no-undef
    const active = getActiveRealtimeSubscriptions(); // eslint-disable-line no-undef
    expect(active).not.toContain('me_team_channel');
    expect(active).not.toContain('me_tasks_channel');
    expect(active).toContain('prod_channel');
  });

  it('removes channels matching a RegExp', () => {
    createRealtimeSubscription('t1', 'capacity_me', {}); // eslint-disable-line no-undef
    createRealtimeSubscription('t2', 'capacity_pm', {}); // eslint-disable-line no-undef
    createRealtimeSubscription('t3', 'feedback_chan', {}); // eslint-disable-line no-undef

    removeRealtimeSubscriptionsMatching(/^capacity_/); // eslint-disable-line no-undef
    const active = getActiveRealtimeSubscriptions(); // eslint-disable-line no-undef
    expect(active).not.toContain('capacity_me');
    expect(active).not.toContain('capacity_pm');
    expect(active).toContain('feedback_chan');
  });

  it('does nothing when no channels match', () => {
    createRealtimeSubscription('t1', 'prod_channel', {}); // eslint-disable-line no-undef
    removeRealtimeSubscriptionsMatching('nonexistent_prefix_'); // eslint-disable-line no-undef
    expect(getActiveRealtimeSubscriptions()).toContain('prod_channel'); // eslint-disable-line no-undef
  });
});

describe('getActiveRealtimeSubscriptions', () => {
  it('returns empty array when no subscriptions exist', () => {
    expect(getActiveRealtimeSubscriptions()).toEqual([]); // eslint-disable-line no-undef
  });

  it('returns list of active channel names', () => {
    createRealtimeSubscription('t1', 'chan_a', {}); // eslint-disable-line no-undef
    createRealtimeSubscription('t2', 'chan_b', {}); // eslint-disable-line no-undef
    const active = getActiveRealtimeSubscriptions(); // eslint-disable-line no-undef
    expect(active).toContain('chan_a');
    expect(active).toContain('chan_b');
    expect(active).toHaveLength(2);
  });

  it('shrinks after removal', () => {
    createRealtimeSubscription('t1', 'chan_x', {}); // eslint-disable-line no-undef
    createRealtimeSubscription('t2', 'chan_y', {}); // eslint-disable-line no-undef
    removeRealtimeSubscription('chan_x'); // eslint-disable-line no-undef
    expect(getActiveRealtimeSubscriptions()).toEqual(['chan_y']); // eslint-disable-line no-undef
  });
});

describe('createMultiTableRealtimeSubscription', () => {
  it('returns null for empty tableConfigs', () => {
    expect(createMultiTableRealtimeSubscription([], 'multi_chan')).toBeNull(); // eslint-disable-line no-undef
  });

  it('returns null for non-array tableConfigs', () => {
    expect(createMultiTableRealtimeSubscription(null, 'multi_chan')).toBeNull(); // eslint-disable-line no-undef
  });

  it('returns null for missing channelName', () => {
    expect(createMultiTableRealtimeSubscription([{ table: 'my_table' }], '')).toBeNull(); // eslint-disable-line no-undef
  });

  it('creates a subscription and registers the channel', () => {
    const result = createMultiTableRealtimeSubscription( // eslint-disable-line no-undef
      [{ table: 'table_a' }, { table: 'table_b' }],
      'multi_chan_1'
    );
    expect(result).not.toBeNull();
    expect(getActiveRealtimeSubscriptions()).toContain('multi_chan_1'); // eslint-disable-line no-undef
  });

  it('returns existing subscription if channel already active', () => {
    const first = createMultiTableRealtimeSubscription([{ table: 'table_a' }], 'multi_chan_2'); // eslint-disable-line no-undef
    const second = createMultiTableRealtimeSubscription([{ table: 'table_a' }], 'multi_chan_2'); // eslint-disable-line no-undef
    expect(first).toBe(second);
    expect(global.supa.channel).toHaveBeenCalledTimes(1);
  });

  it('calls channel.on for each table in config', () => {
    createMultiTableRealtimeSubscription( // eslint-disable-line no-undef
      [{ table: 'table_a', onInsert: jest.fn() }, { table: 'table_b', onUpdate: jest.fn() }],
      'multi_chan_3'
    );
    expect(mockChannelRef.on).toHaveBeenCalledTimes(2);
    const tables = mockChannelRef.on.mock.calls.map(call => call[1].table);
    expect(tables).toContain('table_a');
    expect(tables).toContain('table_b');
  });

  it('skips tableConfig entries without a table field', () => {
    createMultiTableRealtimeSubscription( // eslint-disable-line no-undef
      [{ onInsert: jest.fn() }, { table: 'valid_table' }],
      'multi_chan_4'
    );
    // Only the valid entry should call .on
    expect(mockChannelRef.on).toHaveBeenCalledTimes(1);
  });

  it('fires table-specific callbacks on payload', () => {
    const onInsertA = jest.fn();
    const onUpdateB = jest.fn();

    createMultiTableRealtimeSubscription( // eslint-disable-line no-undef
      [
        { table: 'table_a', onInsert: onInsertA },
        { table: 'table_b', onUpdate: onUpdateB },
      ],
      'multi_chan_5'
    );

    // Simulate INSERT for table_a
    const handlerA = mockChannelRef.on.mock.calls[0][2];
    handlerA({ eventType: 'INSERT', new: { id: 10 } });
    expect(onInsertA).toHaveBeenCalledWith({ id: 10 });

    // Simulate UPDATE for table_b
    const handlerB = mockChannelRef.on.mock.calls[1][2];
    handlerB({ eventType: 'UPDATE', new: { id: 20 } });
    expect(onUpdateB).toHaveBeenCalledWith({ id: 20 });
  });

  it('returns null and does not throw when supa.channel throws', () => {
    global.supa.channel = jest.fn(() => { throw new Error('channel error'); });
    const result = createMultiTableRealtimeSubscription([{ table: 'my_table' }], 'multi_err'); // eslint-disable-line no-undef
    expect(result).toBeNull();
  });
});

