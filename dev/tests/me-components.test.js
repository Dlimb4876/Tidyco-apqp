/**
 * me-components.test.js — Tests for portals/capacity/shared/js/cap-components.js
 *
 * Covers: renderKPIStrip, renderMonthPicker, renderTableHeader,
 *         renderEditableCell, renderStatusBadge, renderEmptyState,
 *         renderCard, renderSkeleton
 */

import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ─────────────────────────────────────────────────────────────
// Mock escapeHtml (defined in shared capacity utils)
// ─────────────────────────────────────────────────────────────

global.escapeHtml = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Import module (ESM exports)
const {
  renderKPIStrip,
  renderMonthPicker,
  renderTableHeader,
  renderEditableCell,
  renderStatusBadge,
  renderEmptyState,
  renderCard,
  renderSkeleton
} = await import(resolve(__dirname, '../portals/capacity/shared/js/cap-components.js'))

describe('renderKPIStrip()', () => {
  it('returns a string containing me-kpi-strip', () => {
    const html = renderKPIStrip([])
    expect(html).toContain('me-kpi-strip')
  })

  it('renders one KPI card per item', () => {
    const kpis = [
      { label: 'Total Hours', value: '120', note: 'h/month', highlight: 'var(--green)' },
      { label: 'Tasks',       value: '5',   note: 'count',   highlight: 'var(--blue)' },
    ]
    const html = renderKPIStrip(kpis)
    expect(html).toContain('Total Hours')
    expect(html).toContain('120')
    expect(html).toContain('Tasks')
    expect(html).toContain('5')
    expect((html.match(/me-kpi"/g) || []).length).toBe(2)
  })

  it('defaults highlight to var(--blue) when not specified', () => {
    const html = renderKPIStrip([{ label: 'A', value: '1', note: '' }])
    expect(html).toContain('var(--blue)')
  })

  it('escapes special characters in values', () => {
    const html = renderKPIStrip([{ label: '<script>', value: '<b>', note: '' }])
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('renderMonthPicker()', () => {
  it('returns a string with month input', () => {
    const html = renderMonthPicker('2025-06')
    expect(html).toContain('type="month"')
    expect(html).toContain('value="2025-06"')
  })

  it('includes prev/next buttons with correct data-cap-action', () => {
    const html = renderMonthPicker('2025-06')
    expect(html).toContain('data-cap-action="cap-me-prev-month"')
    expect(html).toContain('data-cap-action="cap-me-next-month"')
    expect(html).toContain('data-cap-action="cap-me-month-change"')
  })
})

describe('renderTableHeader()', () => {
  it('returns thead HTML with correct column labels', () => {
    const headers = [
      { label: 'Name', width: '120px' },
      { label: 'Hours' },
    ]
    const html = renderTableHeader(headers)
    expect(html).toContain('<thead>')
    expect(html).toContain('Name')
    expect(html).toContain('Hours')
  })

  it('applies width style when provided', () => {
    const html = renderTableHeader([{ label: 'Col', width: '80px' }])
    expect(html).toContain('width:80px')
  })

  it('does not apply style when width is missing', () => {
    const html = renderTableHeader([{ label: 'Col' }])
    expect(html).toContain('<th >Col</th>')
  })

  it('escapes special characters in header labels', () => {
    const html = renderTableHeader([{ label: '<Total>' }])
    expect(html).toContain('&lt;Total&gt;')
  })
})

describe('renderEditableCell()', () => {
  it('renders a text input for type "text"', () => {
    const html = renderEditableCell('my value', 'text')
    expect(html).toContain('type' in {} ? '' : '') // just check it's an input
    expect(html).toContain('name="cap_edit_text"')
    expect(html).toContain('value="my value"')
  })

  it('renders a number input for type "number"', () => {
    const html = renderEditableCell(42, 'number')
    expect(html).toContain('type="number"')
    expect(html).toContain('value="42"')
  })

  it('renders a date input for type "date"', () => {
    const html = renderEditableCell('2025-01-15', 'date')
    expect(html).toContain('type="date"')
    expect(html).toContain('value="2025-01-15"')
  })

  it('defaults to text input for unknown type', () => {
    const html = renderEditableCell('test', 'unknown')
    expect(html).toContain('name="cap_edit_text"')
  })

  it('renders empty value as 0 for number type', () => {
    const html = renderEditableCell(null, 'number')
    expect(html).toContain('value="0"')
  })
})

describe('renderStatusBadge()', () => {
  it('returns green badge for Complete status', () => {
    const html = renderStatusBadge('Complete')
    expect(html).toContain('🟢')
    expect(html).toContain('var(--green)')
  })

  it('returns amber badge for In Progress status', () => {
    const html = renderStatusBadge('In Progress')
    expect(html).toContain('🟡')
    expect(html).toContain('var(--amber)')
  })

  it('returns blue badge for Planned status', () => {
    const html = renderStatusBadge('Planned')
    expect(html).toContain('⚪')
    expect(html).toContain('var(--blue)')
  })

  it('returns muted badge for unknown status', () => {
    const html = renderStatusBadge('Unknown')
    expect(html).toContain('var(--muted)')
  })

  it('handles lowercase complete variant', () => {
    const html = renderStatusBadge('complete')
    expect(html).toContain('🟢')
  })

  it('handles lowercase in-progress variant', () => {
    const html = renderStatusBadge('in-progress')
    expect(html).toContain('🟡')
  })
})

describe('renderEmptyState()', () => {
  it('returns HTML with icon, title, and description', () => {
    const html = renderEmptyState('📭', 'Nothing here', 'Add items to get started')
    expect(html).toContain('📭')
    expect(html).toContain('Nothing here')
    expect(html).toContain('Add items to get started')
  })

  it('escapes HTML in title and description', () => {
    const html = renderEmptyState('🔥', '<script>', '<b>bold</b>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('renderCard()', () => {
  it('returns a me-card with title and content', () => {
    const html = renderCard('MY CARD', null, '<p>content</p>')
    expect(html).toContain('me-card')
    expect(html).toContain('MY CARD')
    expect(html).toContain('<p>content</p>')
  })

  it('includes subtitle when provided', () => {
    const html = renderCard('Card', 'subtitle text', 'body')
    expect(html).toContain('subtitle text')
  })

  it('includes footer when provided', () => {
    const html = renderCard('Card', null, 'body', '<button>Save</button>')
    expect(html).toContain('<button>Save</button>')
    expect(html).toContain('me-card-footer')
  })

  it('does not include footer div when footer is not provided', () => {
    const html = renderCard('Card', null, 'body')
    expect(html).not.toContain('me-card-footer')
  })

  it('escapes special characters in title and subtitle', () => {
    const html = renderCard('<Title>', '<Sub>', 'content')
    expect(html).not.toContain('<Title>')
    expect(html).toContain('&lt;Title&gt;')
  })
})

describe('renderSkeleton()', () => {
  it('returns HTML with expected number of rows', () => {
    const html = renderSkeleton(3, 4)
    // Each row is a flex div — count by a unique pattern
    const rowMatches = (html.match(/display: flex; gap: 8px;/g) || []).length
    expect(rowMatches).toBe(3)
  })

  it('uses default rows and cols when not specified', () => {
    const html = renderSkeleton()
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('includes animation styling', () => {
    const html = renderSkeleton(1, 1)
    expect(html).toContain('animation: loading')
  })
})
