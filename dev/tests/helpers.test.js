const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

// Modal picker state globals (used by closeModal)
global.ctqPickTarget = null;
global.ctqPickSelected = [];
global.bomPickTarget = null;
global.bomPickSelected = [];
global.bomPickFilter = 'all';
global.kitPickTarget = null;
global.kitPickSelected = [];
global.kitPickFilter = 'all';

// Set up DOM from index.html
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Load helpers script
const script = fs.readFileSync(path.resolve(__dirname, '../utils/js/helpers.js'), 'utf8');
eval(script);

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Helpers Module (helpers.js)', () => {
  beforeEach(() => {
    global.ctqPickTarget = null;
    global.ctqPickSelected = [];
    global.bomPickTarget = 'some-target';
    global.bomPickSelected = ['item1'];
    global.bomPickFilter = 'parts';
    global.kitPickTarget = 'some-kit';
    global.kitPickSelected = ['kit-item1'];
    global.kitPickFilter = 'tools';
  });

  // ── esc() ────────────────────────────────────────────────────
  describe('esc()', () => {
    test('should return empty string for null/undefined/empty', () => {
      expect(esc(null)).toBe('');
      expect(esc(undefined)).toBe('');
      expect(esc('')).toBe('');
    });

    test('should escape ampersands', () => {
      expect(esc('a & b')).toBe('a &amp; b');
    });

    test('should escape less-than and greater-than', () => {
      expect(esc('<script>')).toBe('&lt;script&gt;');
    });

    test('should escape double quotes', () => {
      expect(esc('"hello"')).toBe('&quot;hello&quot;');
    });

    test('should escape all special characters together', () => {
      expect(esc('<div class="foo">bar & baz</div>')).toBe(
        '&lt;div class=&quot;foo&quot;&gt;bar &amp; baz&lt;/div&gt;'
      );
    });

    test('should coerce numbers to string', () => {
      expect(esc(42)).toBe('42');
    });

    test('should render numeric zero as "0", not as empty string', () => {
      expect(esc(0)).toBe('0');
    });

    test('should escape single quotes to &#039;', () => {
      expect(esc("it's a test")).toBe("it&#039;s a test");
    });

    test('should leave plain text unchanged', () => {
      expect(esc('Hello World')).toBe('Hello World');
    });
  });

  // ── emptyState() ─────────────────────────────────────────────
  describe('emptyState()', () => {
    test('should return an HTML string with icon, title, and desc', () => {
      const result = emptyState('📭', 'No items', 'Add one to get started');
      expect(result).toContain('📭');
      expect(result).toContain('No items');
      expect(result).toContain('Add one to get started');
    });

    test('should include the empty wrapper class', () => {
      const result = emptyState('🔍', 'Title', 'Desc');
      expect(result).toContain('class="empty"');
    });
  });

  // ── showModal() / closeModal() ────────────────────────────────
  describe('showModal() and closeModal()', () => {
    test('showModal should set display to flex on a known modal', () => {
      // Create a test modal element
      const modal = document.createElement('div');
      modal.id = 'testModal123';
      modal.style.display = 'none';
      document.body.appendChild(modal);

      showModal('testModal123');
      expect(modal.style.display).toBe('flex');
    });

    test('closeModal should set display to none', () => {
      const modal = document.createElement('div');
      modal.id = 'testModal456';
      modal.style.display = 'flex';
      document.body.appendChild(modal);

      closeModal('testModal456');
      expect(modal.style.display).toBe('none');
    });

    test('closeModal should not throw for a non-existent element', () => {
      expect(() => closeModal('nonExistentModal')).not.toThrow();
    });

    test('closeModal on modalCtqPick should reset ctq picker state', () => {
      global.ctqPickTarget = 'some-ctq';
      global.ctqPickSelected = ['x', 'y'];

      // Ensure the element exists
      let el = document.getElementById('modalCtqPick');
      if (!el) {
        el = document.createElement('div');
        el.id = 'modalCtqPick';
        el.style.display = 'flex';
        document.body.appendChild(el);
      } else {
        el.style.display = 'flex';
      }

      closeModal('modalCtqPick');
      expect(global.ctqPickTarget).toBeNull();
      expect(global.ctqPickSelected).toEqual([]);
    });

    test('closeModal on modalBomPick should reset bom picker state', () => {
      let el = document.getElementById('modalBomPick');
      if (!el) {
        el = document.createElement('div');
        el.id = 'modalBomPick';
        document.body.appendChild(el);
      }
      el.style.display = 'flex';

      closeModal('modalBomPick');
      expect(global.bomPickTarget).toBeNull();
      expect(global.bomPickSelected).toEqual([]);
      expect(global.bomPickFilter).toBe('all');
    });

    test('closeModal on modalKitPick should reset kit picker state', () => {
      let el = document.getElementById('modalKitPick');
      if (!el) {
        el = document.createElement('div');
        el.id = 'modalKitPick';
        document.body.appendChild(el);
      }
      el.style.display = 'flex';

      closeModal('modalKitPick');
      expect(global.kitPickTarget).toBeNull();
      expect(global.kitPickSelected).toEqual([]);
      expect(global.kitPickFilter).toBe('all');
    });
  });

  // ── sortedPfd() ───────────────────────────────────────────────
  describe('sortedPfd()', () => {
    test('should sort PFD steps by stepNum ascending', () => {
      const pfd = [
        { stepNum: 30, name: 'C' },
        { stepNum: 10, name: 'A' },
        { stepNum: 20, name: 'B' },
      ];
      const sorted = sortedPfd(pfd);
      expect(sorted[0].name).toBe('A');
      expect(sorted[1].name).toBe('B');
      expect(sorted[2].name).toBe('C');
    });

    test('should not mutate the original array', () => {
      const pfd = [{ stepNum: 20 }, { stepNum: 10 }];
      sortedPfd(pfd);
      expect(pfd[0].stepNum).toBe(20);
    });

    test('should handle empty array', () => {
      expect(sortedPfd([])).toEqual([]);
    });
  });

  // ── calcRPN() ─────────────────────────────────────────────────
  describe('calcRPN()', () => {
    test('should calculate RPN as sev × occ × det', () => {
      expect(calcRPN({ sev: 5, occ: 4, det: 3 })).toBe(60);
    });

    test('should default missing values to 1', () => {
      expect(calcRPN({})).toBe(1);
      expect(calcRPN({ sev: 5 })).toBe(5);
      expect(calcRPN({ sev: 5, occ: 4 })).toBe(20);
    });

    test('should return 1000 for maximum values', () => {
      expect(calcRPN({ sev: 10, occ: 10, det: 10 })).toBe(1000);
    });

    test('should return 1 for minimum values', () => {
      expect(calcRPN({ sev: 1, occ: 1, det: 1 })).toBe(1);
    });
  });

  // ── Keyboard shortcuts ───────────────────────────────────────
  describe('keyboard shortcuts', () => {
    test('Ctrl+/ opens the shortcuts modal', () => {
      const modal = document.getElementById('shortcutsModal');
      modal.style.display = 'none';

      const evt = new KeyboardEvent('keydown', { key: '/', ctrlKey: true, cancelable: true });
      document.dispatchEvent(evt);

      expect(modal.style.display).toBe('flex');
    });

    test('Ctrl+S triggers global save when available', () => {
      global.save = jest.fn();

      const evt = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true });
      document.dispatchEvent(evt);

      expect(global.save).toHaveBeenCalledTimes(1);
    });

    test('Ctrl+F focuses the active search input', () => {
      const search = document.createElement('input');
      search.type = 'search';
      search.id = 'testShortcutSearch';
      search.placeholder = 'Search items';
      document.body.prepend(search);

      const evt = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, cancelable: true });
      document.dispatchEvent(evt);

      expect(document.activeElement).toBe(search);
    });

    test('Escape closes an open modal', () => {
      document.querySelectorAll('.modal-bg').forEach(el => {
        el.style.display = 'none';
      });

      const modal = document.createElement('div');
      modal.id = 'escCloseModal';
      modal.className = 'modal-bg';
      modal.style.display = 'flex';
      document.body.appendChild(modal);

      const evt = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      document.dispatchEvent(evt);

      expect(modal.style.display).toBe('none');
    });
  });

  // ── getWeekNumber() ───────────────────────────────────────────
  describe('getWeekNumber()', () => {
    test('should return 1 for 2024-01-01 (ISO week 1)', () => {
      expect(getWeekNumber(new Date(2024, 0, 1))).toBe(1);
    });

    test('should return 52 or 53 for late December', () => {
      const week = getWeekNumber(new Date(2024, 11, 28));
      expect(week).toBeGreaterThanOrEqual(52);
    });

    test('should return a number between 1 and 53', () => {
      const week = getWeekNumber(new Date(2025, 5, 15));
      expect(week).toBeGreaterThanOrEqual(1);
      expect(week).toBeLessThanOrEqual(53);
    });
  });
});
