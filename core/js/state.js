// ═══════════════════════════════════
// state.js — Global state and constants
// ═══════════════════════════════════

export let db = { projects: [] }
export let currentUserRole = null // 'admin' | 'editor' | 'viewer' — loaded from profiles after login
export let currentUserPermissions = {} // Effective permissions resolved at login (role baseline + team grants)
export let currentUserTeams = [] // Team IDs assigned to the current user (single-team today, multi-team ready)

export const appState = {
  progId: null,
  currentSection: 'hub',
  apqpTab: 'ctq', // ctq|pfd|pfmea|cp
  bomSubTab: 'tree', // tree|aaw_repair|register|tools|equip|cons
  bomPartsRegisterView: 'total', // total|structure|aaw — view mode for rolled-up parts register
  capacityTab: 'root', // root|me|production|projects|logistics|unit6
  prodCapTab: 'dashboard', // dashboard|by-work-area|settings|detail
  pmCapTab: 'tasks', // tasks (project-management capacity)
  productionTab: 'root', // root|products|scheduling|by-product|by-unit
  productDevelopmentTab: 'root', // root|npi|product-management
  operationsTab: 'overview', // overview|flow|risk|people|actions|forecast
  npiTab: 'all', // 'all' | family id — active tab on the NPI project selection screen
  pfmeaRpnFilter: 'all', // all|high|r1_49|r50_99|r100_199|r200_plus
  pfmeaView: 'worksheet', // worksheet|history
  pfmeaExpanded: false, // fullscreen overlay for focused PFMEA editing
  ganttExpanded: false, // fullscreen overlay for NPI Timing Plan
  ctqExpanded: false, // fullscreen overlay for CTQ Matrix
  pfdExpanded: false, // fullscreen overlay for PFD table view
  schedulingExpanded: false, // fullscreen overlay for Production Scheduling
  planByProductExpanded: false, // fullscreen overlay for Plan by Product
  planByUnitExpanded: false, // fullscreen overlay for Plan by Work Area
  ctqSourceFilter: 'all', // all | Customer Spec | OEM Data | Internal Standard | Regulatory | Drawing
  ctqOosFilter: 'all', // all | Repair | Replace | Scrap | Review | TBD
  ctqAgreedFilter: 'all', // all | yes | no
  ctqCoverageFilter: 'all', // all | linked | orphaned — filter CTQs by whether they are referenced in PFD/PFMEA
  trackerSubAsmFilter: 'all', // all|root|<sub-assembly-id>
  prodPlanMonthOffset: 0, // Month offset from current month
  meStartOffset: 0, // Months from today
  prodCapMonthOffset: 0, // Production capacity month offset (perpetual rolling window)
  prodCapUtilizationFactor: 1.0, // Global utilization factor (0.0–1.0) affects available capacity
  tenderGateScopeState: {
    isOpen: false,
    projectId: null,
    selectedGate: 0,
    workingSelections: null
  },

  // Modal picker state
  ctqPickTarget: null,
  ctqPickSelected: [],
  bomPickTarget: null,
  bomPickSelected: [],
  bomPickFilter: 'all',
  bomPickSearch: '',
  bomTreeExpanded: new Set(), // IDs of expanded subassembly nodes in the tree tab
  bomTreeAddParentId: null, // parent node ID when opening the add-part or add-subasm modals
  bomAawTreeExpanded: new Set(), // IDs of expanded nodes in AAW/Repair trees
  bomAawActiveGroupId: null, // group ID for the active AAW/Repair add-part or add-subasm modal
  bomAawGroupParentId: null, // parent node ID within the active AAW/Repair group
  docPickTarget: null,
  docPickSelected: [],
  resourceEditTarget: null, // { stepId, bomType, itemId } for editing resource quantity
  resourceEditQty: 1,
  insertOriginIdx: null,
  collapsedGroups: new Set(),

  // ABC class filter and picker state
  bomAbcFilter: 'all', // 'all' | 'A' | 'B' | 'C' — active filter in BOM parts tab
  abcPickTarget: null, // { progId, type: 'parts' } — import target for ABC picker
  abcPickResults: [], // rows fetched from Supabase for the picker modal
  abcPickLoading: false, // true while fetch is in-flight
  abcPickSearch: '', // live search text in the picker modal
  abcPickClassFilter: 'all', // 'all' | 'A' | 'B' | 'C' — class filter in picker
  abcPickSelected: [], // catalogue IDs selected in the picker modal

  // ABC Catalogue state (central management page)
  abcCatalogueData: [], // all ABC parts from catalogue
  abcCatalogueLoading: false, // true while loading
  abcCatalogueLoaded: false, // true once loaded
  abcCatalogueSearch: '', // search filter text
  abcCatalogueClassFilter: 'all', // 'all' | 'A' | 'B' | 'C' — class filter on catalogue page
  abcCatalogueSort: { field: 'item_desc', ascending: true }, // current sort state for parts table
  abcEditTarget: null, // index into abcCatalogueData during edit, or null for new entry

  // NPI dashboard tab
  npiDashboardTab: 'projects', // 'projects' | 'abc-catalogue'

  // Settings portal active tab
  settingsActiveTab: 'families', // 'families' | 'work-areas' | 'permissions' | 'role-definitions' | 'teams' | 'appearance' | 'about'

  // Action Centre portal state
  actionCentreData: null, // null = unloaded; populated by actionCentreLoad()
  actionCentreLoading: false,
  actionCentreTab: 'all', // 'all' | 'action' | 'pfmea' | 'risk'
  actionCentreStatusFilter: 'open', // 'open' | 'all' | 'closed'
  selectedActionId: null, // Action ID to scroll to when navigating from Action Centre
  selectedPfmeaCauseId: null, // PFMEA cause ID to scroll to when navigating from Action Centre
  selectedRiskId: null, // Risk ID to scroll to when navigating from Action Centre
  npiLoadedProgId: null, // prog_id of the NPI project whose relational data is currently loaded

  // Teams management state
  settingsTeamsEditingId: null,
  settingsTeamsPermissionsEditingId: null,
  settingsTeamsData: null,
  settingsTeamsLoading: false,
  settingsTeamsError: null,

  // Presence + paging
  presenceMap: {},
  projectsPage: 0,
  projectsAllLoaded: false,

  // ── MCS (Manufacturing Change) state ────────────────
  // Approver configuration (loaded from global_settings table, keys: mcs_approver_approval1 / mcs_approver_approval2)
  mcsApproverConfig: null, // { approval1: [{user_id, user_name}], approval2: [] }
  mcsApproverConfigLoading: false,
  mcsAutoViewId: null, // When set, MCS portal auto-opens this change on load

  // Settings MCS tab state
  settingsMcsLoading: false,
  settingsMcsError: null,

  // Core data and filters
  mcsList: [], // All MCS changes loaded from Supabase
  mcsCurrentFilter: {
    status: 'all', // all | open | review | implementing | final_review | implemented | closed
    priority: 'all', // all | critical | high | medium | low
    type: 'all', // all | Engineering | Process | Material | Tooling | Quality | Safety
    source: 'all', // all | Manual | PFMEA | Risk | Customer | Quality | Supply Chain
    myChanges: false, // true = show only changes initiated by current user
    overdueOnly: false, // true = show only overdue open changes
    highPriority: false, // true = show only critical + high priority
    dateRange: 'all', // all | today | week | month | quarter
    product: 'all' // all | <product name>
  },
  mcsViewingId: null, // ECR ID currently in view modal
  mcsEditingId: null, // ECR ID currently being edited
  mcsLoading: false // true while loading from Supabase
}

export function setDb(nextDb) {
  db = nextDb
}

export function setCurrentUserRole(r) {
  currentUserRole = r
}

export function setCurrentUserPermissions(p) {
  currentUserPermissions = p
}

export function setCurrentUserTeams(t) {
  currentUserTeams = t
}

// ── Accessor ─────────────────────────────────────────────────
export function prog() { return db.projects.find(p => p.id === appState.progId) || null }

export function findProjectByProductId(productId) {
  if (!productId || !Array.isArray(db.projects)) return null
  return db.projects.find(p => p && p.product_id === productId) || null
}

export function getDefaultGateSelection(gateNum) {
  const gateDef = GATE_DEFS.find(g => g.num === Number(gateNum))
  if (!gateDef || !Array.isArray(gateDef.items)) return []
  return gateDef.items.map((_, idx) => idx)
}

export function normalizeGateSelections(gateSelections) {
  if (!gateSelections || typeof gateSelections !== 'object') return null

  const normalized = {}
  GATE_DEFS.forEach(g => {
    const gateKey = String(g.num)
    const source = gateSelections[gateKey] || gateSelections[g.num]
    if (!Array.isArray(source)) return

    const maxIndex = g.items.length - 1
    const seen = new Set()
    const clean = []
    source.forEach(raw => {
      const idx = Number(raw)
      if (!Number.isInteger(idx)) return
      if (idx < 0 || idx > maxIndex) return
      if (seen.has(idx)) return
      seen.add(idx)
      clean.push(idx)
    })

    normalized[gateKey] = clean
  })

  return Object.keys(normalized).length > 0 ? normalized : null
}

export function getAllProjectGateSelections(projectId) {
  const project = db.projects.find(p => p.id === projectId)
  if (!project) return null
  return normalizeGateSelections(project.gate_selections)
}

export function getProjectGateSelection(projectId, gateNum) {
  const gateKey = String(Number(gateNum))
  const allSelections = getAllProjectGateSelections(projectId)
  if (!allSelections || !Array.isArray(allSelections[gateKey])) {
    return getDefaultGateSelection(gateNum)
  }
  return allSelections[gateKey].slice()
}

export function isGateSelectionLocked(projectId) {
  const project = db.projects.find(p => p.id === projectId)
  return !!(project && project.gate_selection_locked)
}

function canEditGateSelections(projectId) {
  return !isGateSelectionLocked(projectId)
}

// ── BOM type registry ─────────────────────────────────────────
export const BOM_TYPES = {
  parts:  { label: 'Parts',       icon: '🔩', pc: 'res-pill-part'  },
  tools:  { label: 'Tools',       icon: '🔧', pc: 'res-pill-tool'  },
  equip:  { label: 'Equipment',   icon: '⚙️', pc: 'res-pill-equip' },
  mat:    { label: 'Materials',   icon: '📦', pc: 'res-pill-mat'   },
  cons:   { label: 'Consumables', icon: '🧴', pc: 'res-pill-cons'  }
}

// ── Gate definitions ──────────────────────────────────────────
export const GATE_DEFS = [
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
]

// ── Product family registry ───────────────────────────────────
export const FAMILIES = [
  { id: 'HVAC',             label: 'HVAC',             icon: '❄️', description: 'Heating, ventilation, and air conditioning systems' },
  { id: 'Rotating Machines',label: 'Rotating Machines', icon: '⚙️', description: 'Fans & pumps' },
  { id: 'Pneumatics',       label: 'Pneumatics',        icon: '💨', description: 'Pneumatic components and systems' },
  { id: 'Other',            label: 'Other',             icon: '📋', description: 'Miscellaneous products' },
]

// Returns user-defined families if any exist, otherwise falls back to defaults
export function getFamilies() {
  return (db.families && db.families.length > 0) ? db.families : FAMILIES
}

export function findFamilyRecord(familyRef) {
  if (!familyRef) return null
  const families = getFamilies()
  return families.find(f => f.id === familyRef) ||
    families.find(f => f.name === familyRef) ||
    families.find(f => f.label === familyRef) ||
    null
}

export function getDefaultFamilyId(preferredRef) {
  const fallbackRef = preferredRef || 'Other'
  const families = getFamilies()
  if (!Array.isArray(families) || families.length === 0) return fallbackRef
  const preferred = findFamilyRecord(fallbackRef)
  return preferred ? preferred.id : families[0].id
}

export function normalizeFamilyId(familyRef, preferredFallback) {
  const match = findFamilyRecord(familyRef)
  return match ? match.id : getDefaultFamilyId(preferredFallback)
}

export function syncProjectFamily(project, familyRef, preferredFallback) {
  if (!project) return false
  const fallbackRef = preferredFallback || project.family || 'Other'
  const normalizedFamily = normalizeFamilyId(familyRef || '', fallbackRef)
  if ((project.family || '') === normalizedFamily) return false
  project.family = normalizedFamily
  return true
}

// ── New project factory ─────────────────────────────────────
export function newProgTemplate(name, customer, unit, family, lead, pm, date) {
  const gates = GATE_DEFS.map(g => ({
    gateNum: g.num,
    checks: g.items.map(() => false),
    sigs: g.signatories.map(role => ({ role, name: '', date: '', signed: false }))
  }));
  return {
    id: crypto.randomUUID(), name, customer, unit, family, lead, pm, date,
    ctq: [], pfd: [], pfmea: [], cp: [],
    bom: { parts: [], tools: [], equip: [], mat: [], cons: [], tree: [], aaw_repair: [] },
    gates, actions: [], risks: [], timing: [], gantt: [], subAssemblies: [],
    product_id: null,
    gate_selections: null,
    gate_selection_locked: false,
    gate_selection_locked_at: null,
    gate_selection_locked_by: null
  }
}
