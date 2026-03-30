import { jest } from '@jest/globals'

// ── RLS error payload reused across tests ──────────────────────
const RLS_ERROR = {
  data: null,
  error: {
    message: 'new row violates row-level security policy',
    code: '42501'
  }
}

// ── Mock: helpers (showToast + safeWarn) ────────────────────────
const mockShowToast = jest.fn()
const mockSafeWarn = jest.fn()

jest.unstable_mockModule('../utils/js/helpers.js', () => ({
  showToast: mockShowToast,
  safeWarn: mockSafeWarn,
  esc: jest.fn(x => x),
  emptyState: jest.fn(() => ''),
  showModal: jest.fn()
}))

// ── Mock: supa + currentUser ───────────────────────────────────
// Stable reference — mutate .from in beforeEach rather than reassigning
const supaRef = { from: jest.fn() }
jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: supaRef,
  currentUser: { id: 'test-user', email: 'test@test.com' }
}))

// ── Mock: navigation (transitive dep) ──────────────────────────
jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

// ── Mock: parts-data (transitive dep) ──────────────────────────
jest.unstable_mockModule(
  '../portals/product-development/parts-database/js/parts-data.js',
  () => ({ partsDataApi: {} })
)

// ── Mock: state — mutable so each test can customise prog() ────
let mockProg = {}
jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: { progId: 'proj-1' },
  db: {
    projects: [{ id: 'proj-1', prog_id: 'proj-1' }]
  },
  prog: jest.fn(() => mockProg),
  GATE_DEFS: [
    { name: 'Gate 0', items: [], signatories: ['Quality', 'Engineering'] },
    { name: 'Gate 1', items: [], signatories: ['Quality'] }
  ]
}))

// ── Dynamic import AFTER mocks ─────────────────────────────────
const {
  npiRelSaveCTQ,
  npiRelSaveAction,
  npiRelSaveRisk,
  npiRelSaveGateSig,
  npiRelSaveGate,
  npiRelDeleteAction
} = await import(
  '../portals/product-development/npi/js/npi-data-relational.js'
)

// ================================================================
// Helper: configure supaRef.from so every write returns the
// supplied response (defaults to the RLS error).
// Mutates supaRef in place so the imported binding sees changes.
// ================================================================
function applySupaMock(writeResponse = RLS_ERROR) {
  supaRef.from = jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'proj-1', prog_id: 'proj-1' }], error: null
        })
      })),
      limit: jest.fn().mockResolvedValue({
        data: [{ id: 'proj-1', prog_id: 'proj-1' }], error: null
      })
    })),
    upsert: jest.fn().mockResolvedValue(writeResponse),
    insert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue(writeResponse)
    })),
    update: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue(writeResponse)
    })),
    delete: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue(writeResponse)
    }))
  }))
}

// ================================================================
// Helper: configure supaRef for gate-sig conflict tests.
// The select().eq().single() returns existingSigData,
// while writes go through the normal success/error path.
// Returns { updateEqFn } for assertion in tests.
// ================================================================
function applyConflictMock(existingSigData, updateResponse = { data: [], error: null }) {
  const updateEqFn = jest.fn().mockResolvedValue(updateResponse)

  supaRef.from = jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: existingSigData,
          error: null
        }),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'proj-1', prog_id: 'proj-1' }], error: null
        })
      })),
      limit: jest.fn().mockResolvedValue({
        data: [{ id: 'proj-1', prog_id: 'proj-1' }], error: null
      })
    })),
    upsert: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null })
    })),
    update: jest.fn(() => ({ eq: updateEqFn })),
    delete: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ data: [], error: null })
    }))
  }))

  return { updateEqFn }
}

// ================================================================
//  Tests
// ================================================================

describe('Auth & RLS violation error handling (42501)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    applySupaMock()
    mockProg = {
      ctq: [],
      actions: [],
      risks: [],
      gates: {}
    }
  })

  // ──────────────────────────────────────────────────────────────
  // 1. Upsert-based saves — RLS rejection must NOT crash
  // ──────────────────────────────────────────────────────────────

  describe('npiRelSaveCTQ — RLS rejection on upsert', () => {
    const ctqItem = {
      id: 'ctq-1',
      req: 'Surface finish',
      spec: '≤ 0.8 Ra',
      testMethod: 'Profilometer',
      source: 'Customer Spec',
      oos_action: 'TBD',
      customerAgreed: false
    }

    it('does not throw when Supabase returns code 42501', async () => {
      mockProg.ctq = [ctqItem]
      await expect(npiRelSaveCTQ(ctqItem)).resolves.toBeUndefined()
    })

    it('logs the RLS error via safeWarn', async () => {
      mockProg.ctq = [ctqItem]
      await npiRelSaveCTQ(ctqItem)

      expect(mockSafeWarn).toHaveBeenCalledWith(
        'npiRelSaveCTQ error:',
        expect.objectContaining({ code: '42501' })
      )
    })

    it('does not mutate the local CTQ item on failed write', async () => {
      mockProg.ctq = [ctqItem]
      const before = { ...ctqItem }
      await npiRelSaveCTQ(ctqItem)

      expect(ctqItem.req).toBe(before.req)
      expect(ctqItem.spec).toBe(before.spec)
    })
  })

  describe('npiRelSaveAction — RLS rejection on upsert', () => {
    const actionItem = {
      id: 'act-1',
      desc: 'Review drawings',
      owner: 'John',
      due: '2026-04-01',
      status: 'Open',
      priority: 'High',
      source: 'General',
      notes: ''
    }

    it('does not throw when Supabase returns code 42501', async () => {
      mockProg.actions = [actionItem]
      await expect(npiRelSaveAction(actionItem)).resolves.toBeUndefined()
    })

    it('logs the RLS error via safeWarn', async () => {
      mockProg.actions = [actionItem]
      await npiRelSaveAction(actionItem)

      expect(mockSafeWarn).toHaveBeenCalledWith(
        'npiRelSaveAction error:',
        expect.objectContaining({ code: '42501' })
      )
    })

    it('preserves original action fields after failed write', async () => {
      mockProg.actions = [actionItem]
      await npiRelSaveAction(actionItem)

      expect(actionItem.desc).toBe('Review drawings')
      expect(actionItem.status).toBe('Open')
    })
  })

  describe('npiRelSaveRisk — RLS rejection on upsert', () => {
    const riskItem = {
      id: 'risk-1',
      desc: 'Supplier delay',
      cat: 'Supply Chain',
      owner: 'Jane',
      lik: 4,
      imp: 5,
      mit: 'Dual-source',
      status: 'Open'
    }

    it('does not throw and logs error via safeWarn', async () => {
      mockProg.risks = [riskItem]
      await expect(npiRelSaveRisk(riskItem)).resolves.toBeUndefined()

      expect(mockSafeWarn).toHaveBeenCalledWith(
        'npiRelSaveRisk error:',
        expect.objectContaining({ code: '42501' })
      )
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 2. Delete — RLS rejection
  // ──────────────────────────────────────────────────────────────

  describe('npiRelDeleteAction — RLS rejection on delete', () => {
    it('does not throw when delete is denied by RLS', async () => {
      await expect(npiRelDeleteAction('act-1')).resolves.toBeUndefined()
    })

    it('logs the RLS error via safeWarn', async () => {
      await npiRelDeleteAction('act-1')

      expect(mockSafeWarn).toHaveBeenCalledWith(
        'npiRelDeleteAction error:',
        expect.objectContaining({ code: '42501' })
      )
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 3. Gate signature — RLS rejection on insert (new sig)
  // ──────────────────────────────────────────────────────────────

  describe('npiRelSaveGateSig — RLS rejection on insert', () => {
    beforeEach(() => {
      mockProg.gates = {
        0: {
          _dbId: 'gate-db-1',
          checks: [],
          sigs: [
            { role: 'Quality', name: '', date: null, signed: false }
          ]
        }
      }
    })

    it('does not throw when insert is denied by RLS', async () => {
      await expect(npiRelSaveGateSig(0, 0)).resolves.toBeUndefined()
    })

    it('logs the RLS error via safeWarn', async () => {
      await npiRelSaveGateSig(0, 0)

      expect(mockSafeWarn).toHaveBeenCalledWith(
        'npiRelSaveGateSig insert error:',
        expect.objectContaining({ code: '42501' })
      )
    })

    it('does NOT assign _id to the sig when insert fails', async () => {
      const sig = mockProg.gates[0].sigs[0]
      expect(sig._id).toBeUndefined()

      await npiRelSaveGateSig(0, 0)

      expect(sig._id).toBeUndefined()
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 4. Gate signature — RLS rejection on update (existing sig)
  // ──────────────────────────────────────────────────────────────

  describe('npiRelSaveGateSig — RLS rejection on update', () => {
    beforeEach(() => {
      mockProg.gates = {
        0: {
          _dbId: 'gate-db-1',
          checks: [],
          sigs: [
            { _id: 'sig-1', role: 'Quality', name: 'Alice', date: '2026-03-30', signed: false }
          ]
        }
      }
    })

    it('logs the RLS error when update is denied', async () => {
      await npiRelSaveGateSig(0, 0)

      expect(mockSafeWarn).toHaveBeenCalledWith(
        'npiRelSaveGateSig update error:',
        expect.objectContaining({ code: '42501' })
      )
    })

    it('preserves existing sig fields after failed update', async () => {
      const sig = mockProg.gates[0].sigs[0]
      await npiRelSaveGateSig(0, 0)

      expect(sig.name).toBe('Alice')
      expect(sig.role).toBe('Quality')
      expect(sig._id).toBe('sig-1')
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 5. Gate signature — conflict detection reverts optimistic
  //    local state and shows warning toast
  // ──────────────────────────────────────────────────────────────

  describe('npiRelSaveGateSig — conflict detection + revert', () => {
    beforeEach(() => {
      // Simulate: user just ticked "signed" locally (optimistic update)
      mockProg.gates = {
        0: {
          _dbId: 'gate-db-1',
          checks: [],
          sigs: [
            {
              _id: 'sig-1',
              role: 'Quality',
              name: 'Alice',
              date: '2026-03-30',
              signed: true          // ← optimistic: UI set this to true
            }
          ]
        }
      }

      // DB already has this sig signed by a DIFFERENT user → conflict
      applyConflictMock({
        signed: true, sig_name: 'Bob', sig_date: '2026-03-29'
      })
    })

    it('reverts sig.signed to false when another user already signed', async () => {
      const sig = mockProg.gates[0].sigs[0]
      expect(sig.signed).toBe(true) // optimistic state before save

      await npiRelSaveGateSig(0, 0)

      expect(sig.signed).toBe(false)
    })

    it('reverts sig.name to the existing signer', async () => {
      await npiRelSaveGateSig(0, 0)

      const sig = mockProg.gates[0].sigs[0]
      expect(sig.name).toBe('Bob')
    })

    it('reverts sig.date to the existing signer date', async () => {
      await npiRelSaveGateSig(0, 0)

      const sig = mockProg.gates[0].sigs[0]
      expect(sig.date).toBe('2026-03-29')
    })

    it('shows a warning toast with the conflicting signer name', async () => {
      await npiRelSaveGateSig(0, 0)

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('Already signed by Bob'),
        'warning',
        7000
      )
    })

    it('includes the signed date in the toast message', async () => {
      await npiRelSaveGateSig(0, 0)

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('on 2026-03-29'),
        'warning',
        7000
      )
    })

    it('does NOT call update — returns early after revert', async () => {
      await npiRelSaveGateSig(0, 0)

      // Conflict path returns early, so no safeWarn error
      expect(mockSafeWarn).not.toHaveBeenCalled()
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 6. Gate signature — NO conflict when same user re-signs
  // ──────────────────────────────────────────────────────────────

  describe('npiRelSaveGateSig — same-user re-sign is NOT a conflict', () => {
    let updateEqFn

    beforeEach(() => {
      mockProg.gates = {
        0: {
          _dbId: 'gate-db-1',
          checks: [],
          sigs: [
            {
              _id: 'sig-1',
              role: 'Quality',
              name: 'Alice',
              date: '2026-03-30',
              signed: true
            }
          ]
        }
      }

      // DB shows same user ('Alice') already signed — NOT a conflict
      const refs = applyConflictMock(
        { signed: true, sig_name: 'Alice', sig_date: '2026-03-29' }
      )
      updateEqFn = refs.updateEqFn
    })

    it('does NOT revert when the same user re-signs', async () => {
      const sig = mockProg.gates[0].sigs[0]
      await npiRelSaveGateSig(0, 0)

      expect(sig.signed).toBe(true)
      expect(sig.name).toBe('Alice')
      expect(mockShowToast).not.toHaveBeenCalled()
    })

    it('proceeds to call update on Supabase', async () => {
      await npiRelSaveGateSig(0, 0)

      expect(updateEqFn).toHaveBeenCalled()
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 7. Gate save — RLS rejection on gate insert
  // ──────────────────────────────────────────────────────────────

  describe('npiRelSaveGate — RLS rejection on insert', () => {
    beforeEach(() => {
      mockProg.gates = {
        0: { checks: [], sigs: [] }  // no _dbId → triggers insert path
      }
    })

    it('does not throw when gate insert is denied by RLS', async () => {
      await expect(npiRelSaveGate(0)).resolves.toBeUndefined()
    })

    it('logs the RLS error via safeWarn', async () => {
      await npiRelSaveGate(0)

      expect(mockSafeWarn).toHaveBeenCalledWith(
        'npiRelSaveGate insert error:',
        expect.objectContaining({ code: '42501' })
      )
    })

    it('does NOT assign _dbId when insert fails', async () => {
      await npiRelSaveGate(0)

      expect(mockProg.gates[0]._dbId).toBeUndefined()
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 8. Guard clauses — missing auth context
  // ──────────────────────────────────────────────────────────────

  describe('Guard clauses with missing auth/project context', () => {
    it('npiRelSaveCTQ exits early when item has no id', async () => {
      await npiRelSaveCTQ({ req: 'test' })
      // from() may still be called for project resolution, but upsert should not
      expect(mockSafeWarn).not.toHaveBeenCalled()
    })

    it('npiRelSaveAction exits early when item is null', async () => {
      await npiRelSaveAction(null)
      expect(mockSafeWarn).not.toHaveBeenCalled()
    })

    it('npiRelSaveGateSig exits early when gate has no sigs at index', async () => {
      mockProg.gates = {
        0: { _dbId: 'gate-db-1', checks: [], sigs: [] }
      }
      await npiRelSaveGateSig(0, 5)  // sigIdx out of range
      expect(mockSafeWarn).not.toHaveBeenCalled()
    })
  })
})
