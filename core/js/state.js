// ═══════════════════════════════════
// state.js — Global state and constants
// ═══════════════════════════════════

let db = { projects: [] };
let currentUserRole = null; // 'admin' | 'editor' | 'viewer' — loaded from profiles after login
let progId = null;
let currentSection = 'hub';
let apqpTab = 'ctq'; // ctq|pfd|pfmea|cp
let bomSubTab = 'parts'; // parts|tools|equip|mat|cons|kits
let capacityTab = 'root'; // root|me|production|projects
let prodCapTab  = 'dashboard'; // dashboard|by-work-area|settings|detail
let pmCapTab = 'tasks'; // tasks (project-management capacity)
let productionTab = 'root'; // root|products|scheduling|by-product|by-unit
let productDevelopmentTab = 'root'; // root|npi|product-management
let operationsTab = 'overview'; // overview|flow|risk|people|actions|forecast
let npiTab = 'all'; // 'all' | family id — active tab on the NPI project selection screen
let pfmeaRpnFilter = 'all'; // all|high|r1_49|r50_99|r100_199|r200_plus
let pfmeaView = 'worksheet'; // worksheet|history
let ctqSourceFilter = 'all'; // all | Customer Spec | OEM Data | Internal Standard | Regulatory | Drawing
let ctqOosFilter = 'all'; // all | Repair | Replace | Scrap | Review | TBD
let ctqAgreedFilter = 'all'; // all | yes | no
let trackerSubAsmFilter = 'all'; // all|root|<sub-assembly-id>
let prodPlanMonthOffset = 0; // Month offset from current month
let meStartOffset = 0; // Months from today
let prodCapMonthOffset = 0; // Production capacity month offset (perpetual rolling window)
let prodCapUtilizationFactor = 1.0; // Global utilization factor (0.0–1.0) affects available capacity
let tenderGateScopeState = {
  isOpen: false,
  projectId: null,
  selectedGate: 0,
  workingSelections: null
};

// Modal picker state
let ctqPickTarget = null, ctqPickSelected = [];
let bomPickTarget = null, bomPickSelected = [], bomPickFilter = 'all';
let kitPickTarget = null, kitPickSelected = [], kitPickFilter = 'all';
let docPickTarget = null, docPickSelected = [];
let insertOriginIdx = null;
let collapsedGroups = new Set();

// ABC class filter and picker state
let bomAbcFilter = 'all';       // 'all' | 'A' | 'B' | 'C' — active filter in BOM parts tab
let abcPickTarget = null;       // { progId, type: 'parts' } — import target for ABC picker
let abcPickResults = [];        // rows fetched from Supabase for the picker modal
let abcPickLoading = false;     // true while fetch is in-flight
let abcPickSearch  = '';        // live search text in the picker modal
let abcPickClassFilter = 'all'; // 'all' | 'A' | 'B' | 'C' — class filter in picker
let abcPickSelected = [];       // catalogue IDs selected in the picker modal

// ABC Catalogue state (central management page)
let abcCatalogueData    = [];       // all ABC parts from catalogue
let abcCatalogueLoading = false;    // true while loading
let abcCatalogueLoaded  = false;    // true once loaded
let abcCatalogueSearch  = '';       // search filter text
let abcCatalogueClassFilter = 'all'; // 'all' | 'A' | 'B' | 'C' — class filter on catalogue page
let abcEditTarget = null;           // index into abcCatalogueData during edit, or null for new entry

// NPI dashboard tab
let npiDashboardTab = 'projects'; // 'projects' | 'abc-catalogue'

// Settings portal active tab
let settingsActiveTab = 'families'; // 'families' | 'work-areas' | 'permissions' | 'role-definitions' | 'teams' | 'appearance' | 'about'

// Action Centre portal state
let actionCentreData = null;        // null = unloaded; populated by actionCentreLoad()
let actionCentreLoading = false;
let actionCentreTab = 'all';        // 'all' | 'action' | 'pfmea' | 'risk'
let actionCentreStatusFilter = 'open'; // 'open' | 'all' | 'closed'
let selectedActionId = null;        // Action ID to scroll to when navigating from Action Centre
let selectedPfmeaCauseId = null;    // PFMEA cause ID to scroll to when navigating from Action Centre
let selectedRiskId = null;          // Risk ID to scroll to when navigating from Action Centre
let npiLoadedProgId = null;         // prog_id of the NPI project whose relational data is currently loaded

// Teams management state
let settingsTeamsEditingId = null;
let settingsTeamsPermissionsEditingId = null;
let settingsTeamsData = null;
let settingsTeamsLoading = false;
let settingsTeamsError = null;

// Presence map: { [progId]: [{ email, ts }] }
// Tracks other users currently viewing the same project (updated via Broadcast).
let presenceMap = {};

// ── Pagination state for projects list ──────────────────────
// Tracks the current page loaded and whether all pages have been fetched.
let projectsPage = 0;
let projectsAllLoaded = false;

// ── MCS (Manufacturing Change System) state ────────────────
// Approver configuration (loaded from mcs_approver_settings table)
let mcsApproverConfig = null;     // { engineering: [{user_id, user_name}], qa: [], manufacturing: [], management: [] }
let mcsApproverConfigLoading = false;
let mcsAutoViewId = null;         // When set, MCS portal auto-opens this change on load

// Settings MCS tab state
let settingsMcsLoading = false;
let settingsMcsError = null;

// Core data and filters
let mcsList = [];                                  // All MCS changes loaded from Supabase
let mcsCurrentFilter = {
  status: 'all',                                   // all | open | review | approved | implemented | rejected
  priority: 'all',                                 // all | critical | high | medium | low
  type: 'all',                                     // all | Engineering | Process | Material | Tooling | Quality | Safety
  source: 'all'                                    // all | Manual | PFMEA | Risk | Customer | Quality | Supply Chain
};
let mcsViewingId = null;                           // ECR ID currently in view modal
let mcsEditingId = null;                           // ECR ID currently being edited
let mcsLoading = false;                            // true while loading from Supabase

// ── Accessor ─────────────────────────────────────────────────
function prog() { return db.projects.find(p => p.id === progId) || null; }

function findProjectByProductId(productId) {
  if (!productId || !Array.isArray(db.projects)) return null;
  return db.projects.find(p => p && p.product_id === productId) || null;
}

function getDefaultGateSelection(gateNum) {
  const gateDef = GATE_DEFS.find(g => g.num === Number(gateNum));
  if (!gateDef || !Array.isArray(gateDef.items)) return [];
  return gateDef.items.map((_, idx) => idx);
}

function normalizeGateSelections(gateSelections) {
  if (!gateSelections || typeof gateSelections !== 'object') return null;

  const normalized = {};
  GATE_DEFS.forEach(g => {
    const gateKey = String(g.num);
    const source = gateSelections[gateKey] || gateSelections[g.num];
    if (!Array.isArray(source)) return;

    const maxIndex = g.items.length - 1;
    const seen = new Set();
    const clean = [];
    source.forEach(raw => {
      const idx = Number(raw);
      if (!Number.isInteger(idx)) return;
      if (idx < 0 || idx > maxIndex) return;
      if (seen.has(idx)) return;
      seen.add(idx);
      clean.push(idx);
    });

    normalized[gateKey] = clean;
  });

  return Object.keys(normalized).length > 0 ? normalized : null;
}

function getAllProjectGateSelections(projectId) {
  const project = db.projects.find(p => p.id === projectId);
  if (!project) return null;
  return normalizeGateSelections(project.gate_selections);
}

function getProjectGateSelection(projectId, gateNum) {
  const gateKey = String(Number(gateNum));
  const allSelections = getAllProjectGateSelections(projectId);
  if (!allSelections || !Array.isArray(allSelections[gateKey])) {
    return getDefaultGateSelection(gateNum);
  }
  return allSelections[gateKey].slice();
}

function isGateSelectionLocked(projectId) {
  const project = db.projects.find(p => p.id === projectId);
  return !!(project && project.gate_selection_locked);
}

function canEditGateSelections(projectId) {
  return !isGateSelectionLocked(projectId);
}

// ── BOM type registry ─────────────────────────────────────────
const BOM_TYPES = {
  parts:  { label: 'Parts',       icon: '🔩', pc: 'res-pill-part'  },
  tools:  { label: 'Tools',       icon: '🔧', pc: 'res-pill-tool'  },
  equip:  { label: 'Equipment',   icon: '⚙️', pc: 'res-pill-equip' },
  mat:    { label: 'Materials',   icon: '📦', pc: 'res-pill-mat'   },
  cons:   { label: 'Consumables', icon: '🧴', pc: 'res-pill-cons'  }
};

// ── Gate definitions ──────────────────────────────────────────
const GATE_DEFS = [
  { num: 0, name: 'Pre-Planning',              phase: 'Section 0', signatories: ['ME Manager', 'Operations Director', 'Sales Director'],
    items: ['Tender / ITT received and reviewed','ME resource confirmed available','Bid submitted with ME input','Contract awarded and signed','Project file opened','ME formally assigned'] },
  { num: 1, name: 'Plan and Define',           phase: 'Section 1', signatories: ['ME Manager', 'Operations Director'],
    items: ['All specification information reviewed','Critical-to-Quality requirements identified','Internal CTQ metrics agreed with customer','All tolerances confirmed measurable','Product family lessons learned reviewed','Historic product information reviewed','Obsolescence issues discussed with customer','Long lead items / parts ordered','Lifting and mounting requirements confirmed','NPI team identified and confirmed','Suitable area allocated for NPI','Workshop / tooling / manpower capacity reviewed','Project timing plan produced','Project risk assessment completed','Development unit(s) received'] },
  { num: 2, name: 'Product Design & Dev',      phase: 'Section 2', signatories: ['ME Manager'],
    items: ['All OEM information reviewed','Additional inspection requirements added to CTQ','All CTQ out-of-spec action plans defined','Product family PFD and PFMEA reviewed','CTQ requirements validated against physical product','Cleaning methods defined','Test rig specification defined','Repair specifications defined for all out-of-spec repairs','Unit fully stripped and documented','Obsolete part replacements finalised','Packaging specification defined','AAW parts assessed and on order','Unit wiring identified and captured','Full BoM documented'] },
  { num: 3, name: 'Process Design & Dev',      phase: 'Section 3', signatories: ['ME Manager', 'Operations Director'],
    items: ['Draft inspection procedure completed','Draft work instructions completed for trial build','Preliminary process flow defined','Preliminary PFMEA completed','PFD contains all CTQ requirements','Test rig fully designed','Preliminary control plan completed','Work instructions highlight all process risks','All required tooling and equipment identified','Test rig ordered or in build','BoM structured for kitting','Special tooling within calibration','Overhaul bay has required access','Inspector competency reviewed','Overhaul bay layout finalised','Work instructions reviewed by technicians','All high RPN operations have controls in place'] },
  { num: 4, name: 'Product & Process Validation', phase: 'Section 4', signatories: ['ME Manager', 'Operations Director', 'Sales Director'],
    items: ['Test rig commissioned and validated','Draft test procedure completed','Draft logbook completed','All overhaul parts in stock','Overhaul bays set up','Trial build(s) completed','Trial build feedback incorporated','PFMEA finalised','All new tooling / equipment ordered','Control plan finalised','FAIR signed off by customer','All high RPN actions implemented','Draft AAW repair instructions completed'] },
  { num: 5, name: 'Feedback & Corrective Action', phase: 'Section 5', signatories: ['ME Manager', 'Operations Director', 'Sales Director'],
    items: ['Family PFD, PFMEA and control plan updated with lessons learned','APQP checklist updated for future products','Product handover to Production ME and Operations completed','All documents issued in IMS'] }
];

// ── Product family registry ───────────────────────────────────
const FAMILIES = [
  { id: 'HVAC',             label: 'HVAC',             icon: '❄️', description: 'Heating, ventilation, and air conditioning systems' },
  { id: 'Rotating Machines',label: 'Rotating Machines', icon: '⚙️', description: 'Fans & pumps' },
  { id: 'Pneumatics',       label: 'Pneumatics',        icon: '💨', description: 'Pneumatic components and systems' },
  { id: 'Other',            label: 'Other',             icon: '📋', description: 'Miscellaneous products' },
];

// Returns user-defined families if any exist, otherwise falls back to defaults
function getFamilies() {
  // Check new familiesState first, then old db.families, then defaults
  if (typeof familiesState !== 'undefined' && familiesState.families && familiesState.families.length > 0) {
    return familiesState.families;
  }
  return (db.families && db.families.length > 0) ? db.families : FAMILIES;
}

function findFamilyRecord(familyRef) {
  if (!familyRef) return null;
  const families = getFamilies();
  return families.find(f => f.id === familyRef) ||
    families.find(f => f.name === familyRef) ||
    families.find(f => f.label === familyRef) ||
    null;
}

function getDefaultFamilyId(preferredRef) {
  const fallbackRef = preferredRef || 'Other';
  const families = getFamilies();
  if (!Array.isArray(families) || families.length === 0) return fallbackRef;
  const preferred = findFamilyRecord(fallbackRef);
  return preferred ? preferred.id : families[0].id;
}

function normalizeFamilyId(familyRef, preferredFallback) {
  const match = findFamilyRecord(familyRef);
  return match ? match.id : getDefaultFamilyId(preferredFallback);
}

function syncProjectFamily(project, familyRef, preferredFallback) {
  if (!project) return false;
  const fallbackRef = preferredFallback || project.family || 'Other';
  const normalizedFamily = normalizeFamilyId(familyRef || '', fallbackRef);
  if ((project.family || '') === normalizedFamily) return false;
  project.family = normalizedFamily;
  return true;
}

// ── New project factory ─────────────────────────────────────
function newProgTemplate(name, customer, unit, family, lead, pm, date) {
  const gates = GATE_DEFS.map(g => ({
    gateNum: g.num,
    checks: g.items.map(() => false),
    sigs: g.signatories.map(role => ({ role, name: '', date: '', signed: false }))
  }));
  return {
    id: crypto.randomUUID(), name, customer, unit, family, lead, pm, date,
    ctq: [], pfd: [], pfmea: [], cp: [],
    bom: { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] },
    gates, actions: [], risks: [], timing: [], gantt: [], subAssemblies: [],
    product_id: null,
    gate_selections: null,
    gate_selection_locked: false,
    gate_selection_locked_at: null,
    gate_selection_locked_by: null
  };
}
