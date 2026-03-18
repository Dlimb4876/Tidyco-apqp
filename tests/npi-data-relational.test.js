const fs = require('fs')
const path = require('path')

describe('NPI relational project UUID resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    global.db = {
      projects: [
        {
          id: 'p_local_1',
          dbId: '11111111-1111-4111-8111-111111111111',
          docs: []
        }
      ]
    }
    global.progId = 'p_local_1'
    global.currentUser = { id: '22222222-2222-4222-8222-222222222222', email: 'test@test.com' }
    global.prog = () => global.db.projects[0]

    const upsert = jest.fn().mockResolvedValue({ error: null })
    const select = jest.fn(() => ({ eq: jest.fn(() => ({ limit: jest.fn().mockResolvedValue({ data: [], error: null }) })) }))

    global.supa = {
      from: jest.fn((table) => {
        if (table === 'projects') {
          return { select }
        }
        return { upsert }
      })
    }

    const script = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/npi-data-relational.js'),
      'utf8'
    )
    eval(script)
  })

  test('uses project dbId for document saves', async () => {
    const item = { id: '33333333-3333-4333-8333-333333333333', docNumber: 'DWG-001' }

    await npiRelSaveDoc(item)

    const docCall = global.supa.from.mock.calls.find(([table]) => table === 'npi_documents')
    expect(docCall).toBeTruthy()
    const upsert = global.supa.from('npi_documents').upsert
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: '11111111-1111-4111-8111-111111111111'
      }),
      { onConflict: 'id' }
    )
  })

  test('resolves missing dbId from projects table by prog_id', async () => {
    global.db.projects[0].dbId = null

    const upsert = jest.fn().mockResolvedValue({ error: null })
    const limit = jest.fn().mockResolvedValue({
      data: [{ id: '44444444-4444-4444-8444-444444444444', prog_id: 'p_local_1' }],
      error: null
    })
    const eq = jest.fn(() => ({ limit }))
    const select = jest.fn(() => ({ eq }))

    global.supa = {
      from: jest.fn((table) => {
        if (table === 'projects') {
          return { select }
        }
        return { upsert }
      })
    }

    const script = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/npi-data-relational.js'),
      'utf8'
    )
    eval(script)

    await npiRelSaveDoc({ id: '33333333-3333-4333-8333-333333333333' })

    expect(global.db.projects[0].dbId).toBe('44444444-4444-4444-8444-444444444444')
  })

  test('persists a leading header with a non-null surrogate step number', async () => {
    const step = { id: 'step-1', stepNum: 10, type: 'step', op: 'First Op', detail: '', ctqIds: [], bomRefs: [], docRefs: [] }
    const header = { id: 'header-1', stepNum: null, beforeStepId: 'step-1', type: 'header', op: '', detail: '', ctqIds: [], bomRefs: [], docRefs: [] }
    global.db.projects[0].pfd = [step, header]

    await npiRelSavePFDStep(header)

    const upsert = global.supa.from('npi_pfd_steps').upsert
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'header-1',
        step_num: 9,
        step_type: 'header'
      }),
      { onConflict: 'id' }
    )
  })

  test('hydrates persisted leading and attached headers back into UI shape', () => {
    const rows = [
      { id: 'lead-header', step_num: 9, step_type: 'header', op: '', detail: '', ctq_ids: [], bom_refs: [], doc_refs: [] },
      { id: 'step-1', step_num: 10, step_type: 'step', op: 'Op 10', detail: '', ctq_ids: [], bom_refs: [], doc_refs: [] },
      { id: 'mid-header', step_num: 10, step_type: 'header', op: 'Section 2', detail: '', ctq_ids: [], bom_refs: [], doc_refs: [] },
      { id: 'step-2', step_num: 20, step_type: 'step', op: 'Op 20', detail: '', ctq_ids: [], bom_refs: [], doc_refs: [] }
    ]

    const hydrated = npiRelHydratePfdRows(rows)
    const leadHeader = hydrated.find(row => row.id === 'lead-header')
    const midHeader = hydrated.find(row => row.id === 'mid-header')

    expect(leadHeader.stepNum).toBeNull()
    expect(leadHeader.beforeStepId).toBe('step-1')
    expect(midHeader.afterStepId).toBe('step-1')
  })
})