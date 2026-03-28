const fs = require('fs')
const path = require('path')

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/mcs/js/mcs-modal-shared.js'),
  'utf8'
)

describe('MCS modal shared helpers', () => {
  beforeEach(() => {
    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    eval(`${script}
      ;globalThis.__mcsShared = {
        mcsBuildExtendedJustification,
        mcsParseExtendedJustification,
        mcsBuildStage3ImpactChecklistHtml
      };`) // eslint-disable-line no-eval
  })

  it('stores and parses Stage 3 impact progress from justification', () => {
    const progress = {
      'BOM Change': true,
      'Work Instructions': false
    }
    const built = globalThis.__mcsShared.mcsBuildExtendedJustification(
      'Root cause text',
      'DOC-1',
      'No knock-on',
      '2',
      progress
    )
    const parsed = globalThis.__mcsShared.mcsParseExtendedJustification(built)

    expect(parsed.core).toBe('Root cause text')
    expect(parsed.impactAssessmentHours).toBe('2')
    expect(parsed.documentsAffected).toBe('DOC-1')
    expect(parsed.impactProgress).toEqual(progress)
  })

  it('renders Stage 3 checklist with selected impacts and completion count', () => {
    const html = globalThis.__mcsShared.mcsBuildStage3ImpactChecklistHtml(
      ['BOM Change', 'Training Required'],
      { 'BOM Change': true, 'Training Required': false }
    )

    expect(html).toContain('Impact implementation checklist')
    expect(html).toContain('1/2 complete')
    expect(html).toContain('data-impact-progress="BOM Change"')
    expect(html).toContain('data-impact-progress="Training Required"')
  })
})
