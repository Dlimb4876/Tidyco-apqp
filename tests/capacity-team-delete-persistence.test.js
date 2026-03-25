const fs = require('fs');
const path = require('path');

function loadScript(relativePath) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
  eval(source); // eslint-disable-line no-eval
}

function installSharedHelperStubs() {
  global.meUUID = jest.fn(() => 'uuid-1');
  global.meGetHoursPerWeek = jest.fn((value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 37;
  });
  global.meNormalizeDateOnly = jest.fn((value) => value || '2026-01-01');
  global.meNormalizeAndDedupeHolidays = jest.fn((rows) => (Array.isArray(rows) ? rows : []));
  global.meNormalizeAndDedupeSupportHistory = jest.fn((rows) => (Array.isArray(rows) ? rows : []));
  global.meNormalizeProductSupportBreakdown = jest.fn(() => ({
    hoursPerWeek: 0,
    kittingHours: 0,
    bookingInOutHours: 0,
    productMovementHours: 0
  }));
  global.meNormalizeHolidayRecord = jest.fn((row) => row);
  global.meNormalizeSupportHistoryRecord = jest.fn((row) => row);
  global.meSortSupportHistoryByDate = jest.fn((rows) => (Array.isArray(rows) ? rows : []));
  global.meGetDateMinusOneDay = jest.fn(() => '2026-01-01');
  global.pmSaveTeamRelational = jest.fn().mockResolvedValue(true);
  global.pmSaveTaskRelational = jest.fn().mockResolvedValue({ success: true, taskId: null });
  global.pmSaveProductRelational = jest.fn().mockResolvedValue(true);
  global.pmSaveProductSupportHistoryRelational = jest.fn().mockResolvedValue(true);
  global.logSaveTeamRelational = jest.fn().mockResolvedValue(true);
  global.logSaveTaskRelational = jest.fn().mockResolvedValue({ success: true, taskId: null });
  global.logSaveProductRelational = jest.fn().mockResolvedValue(true);
  global.logSaveProductSupportHistoryRelational = jest.fn().mockResolvedValue(true);
  global.unit6SaveTeamRelational = jest.fn().mockResolvedValue(true);
  global.unit6SaveTaskRelational = jest.fn().mockResolvedValue({ success: true, taskId: null });
  global.unit6SaveProductRelational = jest.fn().mockResolvedValue(true);
  global.unit6SaveProductSupportHistoryRelational = jest.fn().mockResolvedValue(true);
}

function installSupabaseDeleteMock() {
  const eq = jest.fn().mockResolvedValue({ error: null });
  const del = jest.fn().mockReturnValue({ eq });
  const insert = jest.fn().mockResolvedValue({ error: null });
  global.supa = {
    from: jest.fn(() => ({
      delete: del,
      insert
    }))
  };
}

beforeAll(() => {
  installSharedHelperStubs();
  global.window = global;

  loadScript('portals/capacity/project-management/js/pm-data.js');
  loadScript('portals/capacity/logistics/js/log-data.js');
  loadScript('portals/capacity/unit6/js/unit6-data.js');
});

beforeEach(() => {
  installSupabaseDeleteMock();
  global.currentUser = { id: 'user-1' };
  global.setSyncBadge = jest.fn();

  window.pmDataReset();
  window.logDataReset();
  window.unit6DataReset();
});

afterEach(() => {
  delete global.pmSaveTeamRelational;
  delete global.pmSaveTaskRelational;
  delete global.pmSaveProductRelational;
  delete global.pmSaveProductSupportHistoryRelational;
  delete global.pmDeleteTeamRelational;
  delete global.pmDeleteTaskRelational;
  delete global.logSaveTeamRelational;
  delete global.logSaveTaskRelational;
  delete global.logSaveProductRelational;
  delete global.logSaveProductSupportHistoryRelational;
  delete global.logDeleteTeamRelational;
  delete global.logDeleteTaskRelational;
  delete global.unit6SaveTeamRelational;
  delete global.unit6SaveTaskRelational;
  delete global.unit6SaveProductRelational;
  delete global.unit6SaveProductSupportHistoryRelational;
  delete global.unit6DeleteTeamRelational;
  delete global.unit6DeleteTaskRelational;
  delete global.currentUser;
  delete global.setSyncBadge;
  delete global.supa;
});

describe('PM/LOG/UNIT6 team delete persistence', () => {
  it('queues and persists PM team deletes during save', async () => {
    window.pmDataState.team = [
      { id: 'pm-team-1', name: 'PM One', department: 'PM' }
    ];

    window.pmDataDeleteTeam(0);

    expect(window.pmDataPendingDeletes.teams).toEqual(['pm-team-1']);

    global.pmDeleteTeamRelational = jest.fn().mockResolvedValue(true);

    await window.pmDataSave(false);

    expect(global.pmDeleteTeamRelational).toHaveBeenCalledWith('pm-team-1');
    expect(window.pmDataPendingDeletes.teams).toEqual([]);
  });

  it('queues and persists logistics team deletes during save', async () => {
    window.logDataState.team = [
      { id: 'log-team-1', name: 'Log One', department: 'LOG' }
    ];

    window.logDataDeleteTeam(0);

    expect(window.logDataPendingDeletes.teams).toEqual(['log-team-1']);

    global.logDeleteTeamRelational = jest.fn().mockResolvedValue(true);

    await window.logDataSave(false);

    expect(global.logDeleteTeamRelational).toHaveBeenCalledWith('log-team-1');
    expect(window.logDataPendingDeletes.teams).toEqual([]);
  });

  it('queues and persists Unit 6 team deletes during save', async () => {
    window.unit6DataState.team = [
      { id: 'unit6-team-1', name: 'Unit6 One', department: 'UNIT6' }
    ];

    window.unit6DataDeleteTeam(0);

    expect(window.unit6DataPendingDeletes.teams).toEqual(['unit6-team-1']);

    global.unit6DeleteTeamRelational = jest.fn().mockResolvedValue(true);

    await window.unit6DataSave(false);

    expect(global.unit6DeleteTeamRelational).toHaveBeenCalledWith('unit6-team-1');
    expect(window.unit6DataPendingDeletes.teams).toEqual([]);
  });
});
