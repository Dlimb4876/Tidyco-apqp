// ═══════════════════════════════════
// npi-constants.js — Shared NPI constants
// Loaded before all other NPI JS files
// ═══════════════════════════════════

// ── RPN Thresholds ────────────────────────────────────────────
// Used in pfmea.js and dashboard.js for badge colouring and alerts
const RPN_CRITICAL = 200 // rpn-hi class (red)
const RPN_HIGH = 100 // rpn-md class (amber)  — the "high RPN" alert threshold

// ── APQP Tab Keys ─────────────────────────────────────────────
const APQP_TABS = { CTQ: 'ctq', PFD: 'pfd', PFMEA: 'pfmea', CP: 'cp' }

// ── BOM Sub-Tab Keys ──────────────────────────────────────────
// Mirrors the keys of BOM_TYPES in state.js plus 'kits'
const BOM_TABS = ['parts', 'tools', 'equip', 'mat', 'cons', 'kits']

// ── Gantt Chart Configuration ──────────────────────────────────
// Used in timing.js for project timeline visualization
const GANTT_WEEKS = 72 // 18 months
const GANTT_ROLES = ['ME', 'PM', 'Tec', 'QA', 'Log']
const GANTT_SECTIONS = [
  { id: 's0', label: 'G0 — Pre-Planning', color: '#6b7a99' },
  { id: 's1', label: 'G1 — Plan & Define', color: '#0066cc' },
  { id: 's2', label: 'G2 — Product Design', color: '#6d3fa0' },
  { id: 's3', label: 'G3 — Process Design', color: '#0a7566' },
  { id: 's4', label: 'G4 — Validation', color: '#b45309' },
  { id: 's5', label: 'G5 — Feedback & CI', color: '#1a7a3c' }
]
const PLAN_COLOR = '#16a34a' // green — planned
const ACT_COLOR = '#d97706' // orange — actual
