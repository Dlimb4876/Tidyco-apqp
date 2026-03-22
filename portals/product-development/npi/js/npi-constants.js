// ═══════════════════════════════════
// npi-constants.js — Shared NPI constants
// Loaded before all other NPI JS files
// ═══════════════════════════════════

// ── RPN Thresholds ────────────────────────────────────────────
// Used in pfmea.js and dashboard.js for badge colouring and alerts
window.RPN_CRITICAL = 200 // rpn-hi class (red)
window.RPN_HIGH = 100 // rpn-md class (amber)  — the "high RPN" alert threshold
window.PFMEA_SCORE_MIN = 1
window.PFMEA_SCORE_MAX = 10

// ── APQP Tab Keys ─────────────────────────────────────────────
window.APQP_TABS = { CTQ: 'ctq', PFD: 'pfd', PFMEA: 'pfmea', CP: 'cp' }

// ── BOM Sub-Tab Keys ──────────────────────────────────────────
// Mirrors the keys of BOM_TYPES in state.js plus 'kits'
window.BOM_TABS = [...Object.keys(BOM_TYPES), 'kits']

// ── Gantt Chart Configuration ──────────────────────────────────
// Used in timing.js for project timeline visualization
window.GANTT_WEEKS = 72 // 18 months
window.GANTT_ROLES = ['ME', 'PM', 'Tec', 'QA', 'Log']
window.GANTT_SECTIONS = [
  { id: 's0', label: 'G0 — Pre-Planning', color: '#6b7a99' },
  { id: 's1', label: 'G1 — Plan & Define', color: '#0066cc' },
  { id: 's2', label: 'G2 — Product Design', color: '#6d3fa0' },
  { id: 's3', label: 'G3 — Process Design', color: '#0a7566' },
  { id: 's4', label: 'G4 — Validation', color: '#b45309' },
  { id: 's5', label: 'G5 — Feedback & CI', color: '#1a7a3c' }
]
window.PLAN_COLOR = '#16a34a' // green — planned
window.ACT_COLOR = '#d97706' // orange — actual

// ── Special Characteristics ────────────────────────────────────
// Used in PFMEA for safety/critical/major classification (AIAG-VDA Step 3)
window.SPECIAL_CHARS = {
  SAFETY:   { id: 'safety',   label: 'Safety',   symbol: '🦺', color: 'var(--red)' },
  CRITICAL: { id: 'critical', label: 'Critical', symbol: '❗', color: 'var(--amber)' },
  MAJOR:    { id: 'major',    label: 'Major',    symbol: '⚠️', color: 'var(--blue)' }
}
