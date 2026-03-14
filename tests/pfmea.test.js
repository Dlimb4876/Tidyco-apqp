const fs = require('fs');
const path = require('path');

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Minimal globals required by pfmea.js
global.npi = { pfmea: {} };
global.RPN_HIGH = 100;
global.RPN_CRITICAL = 200;
global.PFMEA_SCORE_MIN = 1;
global.PFMEA_SCORE_MAX = 10;
global.save = jest.fn();
global.render = jest.fn();
global.alert = jest.fn();
global.showToast = jest.fn();
global.confirm = jest.fn(() => true);

global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

let activeProgramme;
global.prog = () => activeProgramme;

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/product-development/npi/js/pfmea.js'),
  'utf8'
);
eval(script);

describe('PFMEA core rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeProgramme = {
      cp: [],
      pfd: [],
      ctq: [],
      pfmea: [
        {
          id: 'f1',
          pfdId: 's1',
          mode: 'Seal failure',
          effects: [
            {
              id: 'e1',
              sev: 8,
              effect: 'Leakage',
              causes: [
                {
                  id: 'c1',
                  occ: 5,
                  det: 6,
                  action: { desc: 'Add check', newOcc: 3, newDet: 4 },
                  history: []
                }
              ]
            }
          ]
        }
      ]
    };
  });

  test('normalizes score boundaries and blank values correctly', () => {
    expect(npi.pfmea.pfNormalizeScore('99', false)).toBe(10);
    expect(npi.pfmea.pfNormalizeScore('-2', false)).toBe(2);
    expect(npi.pfmea.pfNormalizeScore('', false)).toBe(1);
    expect(npi.pfmea.pfNormalizeScore('', true)).toBe('');
  });

  test('calculates max RPN across all effects and causes', () => {
    const mode = {
      effects: [
        { sev: 4, causes: [{ occ: 3, det: 2 }] },
        { sev: 9, causes: [{ occ: 7, det: 2 }, { occ: 2, det: 2 }] }
      ]
    };
    expect(npi.pfmea.calcRPN(mode)).toBe(126);
  });

  test('matches RPN values against configured ranges', () => {
    expect(npi.pfmea.rpnInFilter(120, 'high')).toBe(true);
    expect(npi.pfmea.rpnInFilter(80, 'high')).toBe(false);
    expect(npi.pfmea.rpnInFilter(35, 'r1_49')).toBe(true);
    expect(npi.pfmea.rpnInFilter(70, 'r50_99')).toBe(true);
    expect(npi.pfmea.rpnInFilter(140, 'r100_199')).toBe(true);
    expect(npi.pfmea.rpnInFilter(240, 'r200_plus')).toBe(true);
  });

  test('filters operation by max mode RPN', () => {
    const mode = {
      effects: [
        { sev: 3, causes: [{ occ: 2, det: 2 }] },
        { sev: 8, causes: [{ occ: 5, det: 4 }] }
      ]
    };

    expect(npi.pfmea.modeMatchesFilter(mode, 'high')).toBe(true);
    expect(npi.pfmea.modeMatchesFilter(mode, 'r50_99')).toBe(false);
    expect(npi.pfmea.modeMatchesFilter(mode, 'r100_199')).toBe(true);
  });

  test('implements action, updates OCC/DET, and writes history', () => {
    npi.pfmea.pfImplementAction(0, 0, 0);

    const cause = activeProgramme.pfmea[0].effects[0].causes[0];
    expect(cause.occ).toBe(3);
    expect(cause.det).toBe(4);
    expect(cause.history).toHaveLength(1);
    expect(cause.history[0].rpn).toBe(240);
    expect(cause.history[0].newRpn).toBe(96);
    expect(cause.action).toEqual({
      desc: '',
      taken: '',
      owner: '',
      due: '',
      newOcc: '',
      newDet: ''
    });
    expect(save).toHaveBeenCalled();
    expect(render).toHaveBeenCalled();
  });

  test('alerts and aborts when no action fields are set', () => {
    const cause = activeProgramme.pfmea[0].effects[0].causes[0];
    cause.action = { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' };

    npi.pfmea.pfImplementAction(0, 0, 0);

    expect(showToast).toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });
});
