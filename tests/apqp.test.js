const fs = require('fs');
const path = require('path');

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Minimal globals required by apqp.js
global.npi = { apqp: {}, pfmea: {}, nav: {} };
global.save = jest.fn();
global.render = jest.fn();
global.alert = jest.fn();
global.showToast = jest.fn();
global.apqpTab = 'ctq';
global.collapsedGroups = new Set();
global.insertOriginIdx = null;
global.ctqPickTarget = null;
global.ctqPickSelected = [];
global.bomPickTarget = null;
global.bomPickSelected = [];
global.bomPickFilter = 'all';
global.BOM_TYPES = {
  parts: { label: 'Parts', icon: 'P', pc: 'tag-parts' },
  tools: { label: 'Tools', icon: 'T', pc: 'tag-tools' },
  equip: { label: 'Equip', icon: 'E', pc: 'tag-equip' },
  mat: { label: 'Mat', icon: 'M', pc: 'tag-mat' },
  cons: { label: 'Cons', icon: 'C', pc: 'tag-cons' }
};

global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

let activeProgramme;
global.prog = () => activeProgramme;

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/product-development/npi/js/apqp.js'),
  'utf8'
);
eval(script);

describe('APQP sync behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeProgramme = {
      ctq: [{ id: 'ctq1', spec: '50+-0.05', oos_action: 'Review' }],
      pfd: [{ id: 's1', stepNum: 10, op: 'Press', ctqIds: ['ctq1'], bomRefs: [] }],
      pfmea: [
        {
          id: 'f1',
          pfdId: 's1',
          mode: 'Leak',
          effects: [
            {
              id: 'e1',
              effect: 'Pressure loss',
              causes: [
                { id: 'c1', cause: 'Seal wear', detect: 'Visual check', prevent: '' }
              ]
            }
          ]
        }
      ],
      cp: [],
      bom: { parts: [], tools: [], equip: [], mat: [], cons: [] }
    };
  });

  test('syncFromPFMEA adds missing cause rows into Control Plan', () => {
    npi.apqp.syncFromPFMEA();

    expect(activeProgramme.cp).toHaveLength(1);
    expect(activeProgramme.cp[0].pfmeaId).toBe('f1');
    expect(activeProgramme.cp[0].pfmeaEffectId).toBe('e1');
    expect(activeProgramme.cp[0].pfmeaCauseId).toBe('c1');
    expect(activeProgramme.cp[0].method).toBe('Visual check');
    expect(activeProgramme.cp[0].spec).toBe('50+-0.05');
    expect(activeProgramme.cp[0].reaction).toBe('Review');
    expect(activeProgramme.cp[0].ctqIds).toEqual(['ctq1']);
    expect(save).toHaveBeenCalled();
    expect(render).toHaveBeenCalled();
  });

  test('syncFromPFMEA does not duplicate existing cause links', () => {
    activeProgramme.cp.push({ id: 'cp1', pfmeaCauseId: 'c1' });

    npi.apqp.syncFromPFMEA();

    expect(showToast).toHaveBeenCalledWith('All PFMEA causes already in control plan.', 'info');
    expect(activeProgramme.cp).toHaveLength(1);
    expect(save).not.toHaveBeenCalled();
  });

  test('addCP creates a default manual row', () => {
    npi.apqp.addCP();

    expect(activeProgramme.cp).toHaveLength(1);
    expect(activeProgramme.cp[0].type).toBe('Process');
    expect(activeProgramme.cp[0].pfmeaId).toBe('');
    expect(save).toHaveBeenCalled();
    expect(render).toHaveBeenCalled();
  });
});
