import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/operations/js/operations-infographic.js'),
  'utf8'
);

describe('operations infographic', () => {
  beforeEach(async () => {
    global.alert = jest.fn();
    const module = await import(`data:text/javascript,${encodeURIComponent(script + '\n;globalThis.__opsInfographic = { opsInfographicBar, opsInfographicTone, opsInfographicUnitCards };')}`);
    globalThis.__opsInfographic = module;
  });

  it('renders a clamped progress bar width and tone color', () => {
    const html = globalThis.__opsInfographic.opsInfographicBar(150, 'critical');
    expect(html).toContain('width:100%');
    expect(html).toContain('#b2352f');
  });

  it('returns expected tone values from utilisation and ready', () => {
    expect(globalThis.__opsInfographic.opsInfographicTone(95, true)).toBe('critical');
    expect(globalThis.__opsInfographic.opsInfographicTone(85, true)).toBe('watch');
    expect(globalThis.__opsInfographic.opsInfographicTone(70, true)).toBe('good');
    expect(globalThis.__opsInfographic.opsInfographicTone(50, false)).toBe('watch');
  });

  it('renders unit cards for operations units with per-unit headings', () => {
    const html = globalThis.__opsInfographic.opsInfographicUnitCards([
      { workArea: 'Unit 2', utilisation: 82, ready: true, demand: 100, capacity: 120, headroom: 20 },
      { workArea: 'Unit 3', utilisation: 91, ready: true, demand: 110, capacity: 120, headroom: 10 },
    ]);

    expect(html).toContain('Unit 2');
    expect(html).toContain('Unit 3');
    expect(html).toContain('Headroom');
  });

  it('returns empty string when unit list is missing', () => {
    expect(globalThis.__opsInfographic.opsInfographicUnitCards(null)).toBe('');
    expect(globalThis.__opsInfographic.opsInfographicUnitCards([])).toBe('');
  });

  it('opens a popup and writes the infographic html', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('no logo')));
    global.opsBuildMetrics = jest.fn(() => ({
      healthScore: 88,
      projectsFlow: { active: 7 },
      actions: { overdue: 0 },
      risk: { highRpn: 1 },
      gate: { percentage: 92 },
      me: { utilisation: 75, ready: true, demand: 120, capacity: 160, headroom: 40 },
      pm: { utilisation: 83, ready: true, demand: 100, capacity: 120, headroom: 20 },
      log: { utilisation: 70, ready: true, demand: 80, capacity: 115, headroom: 35 },
      operationsUnits: [
        { workArea: 'Unit 2', utilisation: 70, ready: true, demand: 70, capacity: 100, headroom: 30 },
      ],
      production: { total: 10, active: 4, completed: 6, completionRate: 60 },
    }));

    const write = jest.fn();
    const close = jest.fn();
    window.open = jest.fn(() => ({ document: { write, close } }));

    await window.opsGenerateInfographic();

    expect(window.open).toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
    expect(String(write.mock.calls[0][0])).toContain('Capacity Infographic');
  });

  it('alerts user when popup is blocked', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('no logo')));
    global.opsBuildMetrics = jest.fn(() => ({
      healthScore: 50,
      projectsFlow: { active: 1 },
      actions: { overdue: 1 },
      risk: { highRpn: 3 },
      gate: { percentage: 50 },
      me: { utilisation: 99, ready: true, demand: 99, capacity: 100, headroom: 1 },
      pm: { utilisation: 99, ready: true, demand: 99, capacity: 100, headroom: 1 },
      log: { utilisation: 99, ready: true, demand: 99, capacity: 100, headroom: 1 },
      operationsUnits: [],
      production: { total: 1, active: 1, completed: 0, completionRate: 0 },
    }));

    window.open = jest.fn(() => null);

    await window.opsGenerateInfographic();

    expect(global.alert).toHaveBeenCalled();
  });
});
