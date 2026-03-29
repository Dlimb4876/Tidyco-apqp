import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadNpiEventsHandlers() {
  const script = readFileSync(
    path.resolve(__dirname, '../portals/product-development/npi/js/npi-events.js'),
    'utf8'
  )
  const strippedImports = script.replace(/^import\s+.*$/gm, '')
  const cjsReady = strippedImports
    .replace(/export function setupNpiEvents\s*\(/, 'function setupNpiEvents(')
    .replace(/export function teardownNpiEvents\s*\(/, 'function teardownNpiEvents(')
    .replace(/export function initNpiEvents\s*\(/, 'function initNpiEvents(')

  eval(`${cjsReady}
    ;globalThis.__npiEventsExports = { setupNpiEvents, teardownNpiEvents, initNpiEvents }
  `)
  return globalThis.__npiEventsExports
}

describe('NPI events PFMEA search continuity', () => {
  beforeEach(() => {
    jest.useFakeTimers()

    document.body.innerHTML = `
      <div id="npi-content">
        <input type="text" data-action="pfmea-text-search" value="">
      </div>
    `

    global.npi = {
      events: {},
      pfmea: {
        pfSetExtraFilter: jest.fn((key, value) => {
          const host = document.getElementById('npi-content')
          host.innerHTML = `<input type="text" data-action="pfmea-text-search" value="${value}">`
        })
      }
    }

    global.preserveInputCaretAfterRender = function(inputEl, rerenderFn, options = {}) {
      const selectionStart = typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : null
      const selectionEnd = typeof inputEl.selectionEnd === 'number' ? inputEl.selectionEnd : selectionStart
      rerenderFn()
      setTimeout(() => {
        const replacement = document.querySelector(options.replacementSelector)
        if (!replacement) return
        replacement.focus()
        if (selectionStart !== null && typeof replacement.setSelectionRange === 'function') {
          const len = replacement.value.length
          const start = Math.min(selectionStart, len)
          const end = Math.min(selectionEnd === null ? start : selectionEnd, len)
          replacement.setSelectionRange(start, end)
        }
      }, 0)
    }

    global.showGuide = jest.fn()
    global.flushDeferred = jest.fn()

    const { initNpiEvents } = loadNpiEventsHandlers()
    initNpiEvents({
      getNpi: () => global.npi
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('pfmea-text-search preserves focus and caret after debounced rerender', () => {
    const input = document.querySelector('[data-action="pfmea-text-search"]')
    input.value = 'abc'
    input.focus()
    input.setSelectionRange(2, 2)

    npi.events._onInput({ target: input })

    jest.advanceTimersByTime(300)
    jest.runOnlyPendingTimers()

    expect(npi.pfmea.pfSetExtraFilter).toHaveBeenCalledWith('searchText', 'abc')

    const replacement = document.querySelector('[data-action="pfmea-text-search"]')
    expect(document.activeElement).toBe(replacement)
    expect(replacement.selectionStart).toBe(2)
    expect(replacement.selectionEnd).toBe(2)
  })
})
