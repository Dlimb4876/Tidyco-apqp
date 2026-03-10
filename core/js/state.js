// ═══════════════════════════════════
// state.js — Global state and constants
// ═══════════════════════════════════

let db = { programmes: [] };
let progId = null;
let currentSection = 'hub';
let apqpTab = 'ctq'; // ctq|pfd|pfmea|cp
let bomSubTab = 'parts'; // parts|tools|equip|mat|cons|kits
let capacityTab = 'root'; // root|me|overhaul|projects
let productionTab = 'root'; // root|products|scheduling|by-product|by-unit
let productDevelopmentTab = 'root'; // root|npi|product-management
let prodPlanWeekOffset = 0; // Week offset for 4-week rolling view
let meStartOffset = 0; // Months from today

// Modal picker state
let ctqPickTarget = null, ctqPickSelected = [];
let bomPickTarget = null, bomPickSelected = [], bomPickFilter = 'all';
let kitPickTarget = null, kitPickSelected = [], kitPickFilter = 'all';
let insertOriginIdx = null;
let collapsedGroups = new Set();

// ── Accessor ─────────────────────────────────────────────────
function prog() { return db.programmes.find(p => p.id === progId) || null; }

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
    items: ['Tender / ITT received and reviewed','ME resource confirmed available','Bid submitted with ME input','Contract awarded and signed','Programme file opened','ME formally assigned'] },
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
  { id: 'HVAC',             label: 'HVAC',             icon: '❄️' },
  { id: 'Rotating Machines',label: 'Rotating Machines', icon: '⚙️' },
  { id: 'Pneumatics',       label: 'Pneumatics',        icon: '💨' },
  { id: 'Other',            label: 'Other',             icon: '📋' },
];

// ── New programme factory ─────────────────────────────────────
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
    gates, actions: [], risks: [], timing: [], gantt: [], subAssemblies: []
  };
}
