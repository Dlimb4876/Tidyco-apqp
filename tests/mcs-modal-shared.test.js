import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MCS modal shared helpers', () => {
  let mcsBuildExtendedJustification;
  let mcsParseExtendedJustification;
  let mcsBuildStage3ImpactChecklistHtml;

  beforeEach(async () => {
    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    // Import module after setting up mocks
    const mcsShared = await import('../portals/mcs/js/mcs-modal-shared.js')
    mcsBuildExtendedJustification = mcsShared.mcsBuildExtendedJustification
    mcsParseExtendedJustification = mcsShared.mcsParseExtendedJustification
    mcsBuildStage3ImpactChecklistHtml = mcsShared.mcsBuildStage3ImpactChecklistHtml
  })

  it('stores and parses Stage 3 impact progress from justification', () => {
    const progress = {
      'BOM Change': true,
      'Work Instructions': false
    }
    const built = mcsBuildExtendedJustification(
      'Root cause text',
      'DOC-1',
      'No knock-on',
      '2',
      progress
    )
    const parsed = mcsParseExtendedJustification(built)

    expect(parsed.core).toBe('Root cause text')
    expect(parsed.impactAssessmentHours).toBe('2')
    expect(parsed.documentsAffected).toBe('DOC-1')
    expect(parsed.impactProgress).toEqual(progress)
  })

  it('renders Stage 3 checklist with selected impacts and completion count', () => {
    const html = mcsBuildStage3ImpactChecklistHtml(
      ['BOM Change', 'Training Required'],
      { 'BOM Change': true, 'Training Required': false }
    )

    expect(html).toContain('Impact implementation checklist')
    expect(html).toContain('1/2 complete')
    expect(html).toContain('data-impact-progress="BOM Change"')
    expect(html).toContain('data-impact-progress="Training Required"')
  })
})
