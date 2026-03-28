const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

// Mock global functions
global.showModal = jest.fn();
global.closeModal = jest.fn();

// Set up DOM from index.html
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Read and extract GUIDE_CONTENT from guide.js for validation
const guideContent = fs.readFileSync(path.resolve(__dirname, '../utils/js/guide.js'), 'utf8');

// Extract GUIDE_CONTENT object using regex
const guideContentMatch = guideContent.match(/const GUIDE_CONTENT = \{([\s\S]*?)\n\};/);
const showGuideMatch = guideContent.match(/function showGuide\(key\) \{([\s\S]*?)\n\}/);

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Guide Module (guide.js)', () => {
  // ── File Structure Tests ───────────────────────────────────
  describe('File Structure', () => {
    test('should contain GUIDE_CONTENT constant', () => {
      expect(guideContent).toContain('const GUIDE_CONTENT = {');
    });

    test('should contain showGuide function', () => {
      expect(guideContent).toContain('function showGuide(key)');
    });

    test('should reference guideModalTitle element', () => {
      expect(guideContent).toContain("document.getElementById('guideModalTitle')");
    });

    test('should reference guideModalBody element', () => {
      expect(guideContent).toContain("document.getElementById('guideModalBody')");
    });

    test('should call showModal with modalGuide', () => {
      expect(guideContent).toContain("showModal('modalGuide')");
    });
  });

  // ── GUIDE_CONTENT Keys ─────────────────────────────────────
  describe('GUIDE_CONTENT Coverage', () => {
    test('should have guide content for hub', () => {
      expect(guideContent).toContain('hub: {');
      expect(guideContent).toContain("title: '🏠 Tidyco Operations Portal");
    });

    test('should have guide content for capacity pages', () => {
      expect(guideContent).toContain('capacity: {');
      expect(guideContent).toContain("'capacity-me': {");
      expect(guideContent).toContain("'capacity-production': {");
      expect(guideContent).toContain("'capacity-pm': {");
    });

    test('should have guide content for NPI pages', () => {
      expect(guideContent).toContain("'npi-projects': {");
      expect(guideContent).toContain("'npi-dashboard': {");
      expect(guideContent).toContain("'npi-apqp': {");
      expect(guideContent).toContain("'npi-ctq': {");
      expect(guideContent).toContain("'npi-pfd': {");
      expect(guideContent).toContain("'npi-pfmea': {");
      expect(guideContent).toContain("'npi-cp': {");
      expect(guideContent).toContain("'npi-actions': {");
      expect(guideContent).toContain("'npi-risks': {");
      expect(guideContent).toContain("'npi-bom': {");
      expect(guideContent).toContain("'npi-timing': {");
      expect(guideContent).toContain("'npi-gates': {");
    });

    test('should have guide content for product management', () => {
      expect(guideContent).toContain("'product-management': {");
      expect(guideContent).toContain("'product-family-db': {");
      expect(guideContent).toContain("'parts-database': {");
    });

    test('should have guide content for production', () => {
      expect(guideContent).toContain('production: {');
      expect(guideContent).toContain("'production-scheduling': {");
    });

    test('should have guide content for operations', () => {
      expect(guideContent).toContain('operations: {');
    });

    test('should have guide content for MCS', () => {
      expect(guideContent).toContain('mcs: {');
    });

    test('should have guide content for feedback', () => {
      expect(guideContent).toContain('feedback: {');
    });

    test('should have guide content for action-centre', () => {
      expect(guideContent).toContain("'action-centre': {");
    });

    test('should have guide content for settings', () => {
      expect(guideContent).toContain('settings: {');
    });
  });

  // ── Content Validation ──────────────────────────────────────
  describe('Content Validation', () => {
    test('hub guide should contain Capacity section', () => {
      expect(guideContent).toContain('Capacity');
      expect(guideContent).toContain('Product Development');
      expect(guideContent).toContain('Production');
    });

    test('ME capacity guide should contain key sections', () => {
      expect(guideContent).toContain('Capacity Chart');
      expect(guideContent).toContain('Team');
      expect(guideContent).toContain('Holiday Planner');
    });

    test('PFMEA guide should contain RPN explanation', () => {
      expect(guideContent).toContain('RPN');
      expect(guideContent).toContain('SEV');
      expect(guideContent).toContain('OCC');
      expect(guideContent).toContain('DET');
    });

    test('BOM guide should mention AAW & Repair', () => {
      expect(guideContent).toContain('AAW');
      expect(guideContent).toContain('Repair');
    });

    test('MCS guide should mention approval workflow', () => {
      expect(guideContent).toContain('approval');
      expect(guideContent).toContain('ECR');
    });

    test('action-centre guide should describe item types', () => {
      expect(guideContent).toContain('action');
      expect(guideContent).toContain('PFMEA');
      expect(guideContent).toContain('risk');
      expect(guideContent).toContain('MCS');
    });

    test('settings guide should cover all tabs', () => {
      expect(guideContent).toContain('Families');
      expect(guideContent).toContain('Work Areas');
      expect(guideContent).toContain('Permissions');
      expect(guideContent).toContain('Teams');
    });
  });

  // ── showGuide Function Tests ────────────────────────────────
  describe('showGuide Function', () => {
    test('should check if content exists before proceeding', () => {
      expect(guideContent).toContain('const content = GUIDE_CONTENT[key]');
      expect(guideContent).toContain('if (!content) return');
    });

    test('should check for modal elements', () => {
      expect(guideContent).toContain("const titleEl = document.getElementById('guideModalTitle')");
      expect(guideContent).toContain("const bodyEl = document.getElementById('guideModalBody')");
      expect(guideContent).toContain('if (!titleEl || !bodyEl) return');
    });

    test('should set text content and innerHTML', () => {
      expect(guideContent).toContain('titleEl.textContent = content.title');
      expect(guideContent).toContain('bodyEl.innerHTML = content.body');
    });

    test('should call showModal with correct ID', () => {
      expect(guideContent).toContain("showModal('modalGuide')");
    });
  });

  // ── Integration with Portal Tests ──────────────────────────
  describe('Portal Integration References', () => {
    const jsFiles = [
      'portals/hub/js/hub.js',
      'portals/capacity/me/js/me-capacity.js',
      'portals/capacity/production/js/prod-capacity.js',
      'portals/capacity/project-management/js/pm-capacity.js',
      'portals/product-development/npi/js/dashboard.js',
      'portals/product-development/npi/js/apqp.js',
      'portals/product-development/npi/js/npi-ctq.js',
      'portals/product-development/npi/js/trackers.js',
      'portals/product-development/npi/js/npi-cp.js',
      'portals/product-development/npi/js/timing.js',
      'portals/product-development/npi/js/gates.js',
      'portals/production/js/production.js',
      'portals/mcs/js/mcs-main.js',
      'portals/feedback/js/feedback.js',
      'portals/action-centre/js/action-centre.js'
    ];

    jsFiles.forEach(file => {
      const filePath = path.resolve(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/showGuide\('([^']+)'\)/g) || [];
        
        if (matches.length > 0) {
          matches.forEach(match => {
            const key = match.match(/showGuide\('([^']+)'\)/)?.[1];
            if (key) {
              test(`${file} references guide key that exists in guide.js: ${key}`, () => {
                // Check if the key exists in GUIDE_CONTENT
                const keyPattern = key.includes('-') ? `'${key}':` : `${key}:`;
                expect(guideContent).toContain(keyPattern);
              });
            }
          });
        }
      }
    });
  });

  // ── Guide Modal HTML Tests ─────────────────────────────────
  describe('Guide Modal HTML', () => {
    test('index.html should contain guide modal', () => {
      const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
      expect(html).toContain("id='modalGuide'");
      expect(html).toContain("id='guideModalTitle'");
      expect(html).toContain("id='guideModalBody'");
    });
  });
});
