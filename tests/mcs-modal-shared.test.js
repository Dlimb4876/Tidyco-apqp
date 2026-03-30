import { jest } from '@jest/globals'

// Mock esc function globally
global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const { mcsBuildExtendedJustification, mcsParseExtendedJustification, mcsBuildStage3ImpactChecklistHtml } = await import('../portals/mcs/js/mcs-modal-shared.js')

describe('MCS modal shared helpers', () => {
  describe('mcsBuildExtendedJustification & mcsParseExtendedJustification', () => {
    it('should round-trip justification data', () => {
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
    })

    it('mcsBuildExtendedJustification should return string', () => {
      const result = mcsBuildExtendedJustification('test', 'DOC', 'knockon', '1', {})
      expect(typeof result).toBe('string')
    })

    it('mcsParseExtendedJustification should return object', () => {
      const built = mcsBuildExtendedJustification('test', 'DOC', 'knockon', '1', {})
      const result = mcsParseExtendedJustification(built)
      expect(typeof result).toBe('object')
    })
  })

  describe('mcsBuildStage3ImpactChecklistHtml', () => {
    it('should return HTML string', () => {
      const html = mcsBuildStage3ImpactChecklistHtml(
        ['BOM Change'],
        { 'BOM Change': true }
      )
      expect(typeof html).toBe('string')
    })

    it('should include impact items in HTML', () => {
      const html = mcsBuildStage3ImpactChecklistHtml(
        ['BOM Change', 'Training Required'],
        { 'BOM Change': true, 'Training Required': false }
      )
      expect(html).toContain('BOM Change')
      expect(html).toContain('Training Required')
    })

    it('should handle empty impact array', () => {
      const html = mcsBuildStage3ImpactChecklistHtml([], {})
      expect(typeof html).toBe('string')
    })
  })
})
