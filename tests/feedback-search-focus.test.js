const fs = require('fs')
const path = require('path')

describe('Feedback search typing continuity', () => {
  beforeEach(() => {
    jest.useFakeTimers()

    document.body.innerHTML = '<div id="mainContent"></div>'

    global.currentUser = { id: 'user-1', email: 'test@test.com' }
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
    global.createRealtimeSubscription = jest.fn()
    global.removeRealtimeSubscription = jest.fn()

    eval(fs.readFileSync(path.resolve(__dirname, '../portals/feedback/js/feedback-constants.js'), 'utf8'))
    eval(fs.readFileSync(path.resolve(__dirname, '../portals/feedback/js/feedback-data.js'), 'utf8'))
    eval(fs.readFileSync(path.resolve(__dirname, '../utils/js/helpers.js'), 'utf8'))
    eval(fs.readFileSync(path.resolve(__dirname, '../portals/feedback/js/feedback.js'), 'utf8'))

    window.feedbackDataManager.state.tab = 'browse'
    window.feedbackDataManager.state.feedback = [
      {
        id: 'f_1',
        feedback_type: 'bug',
        status: 'open',
        title: 'Search regression',
        description: 'Caret should remain',
        page_area: 'capacity',
        submitted_by: 'qa@test.com'
      }
    ]

    global.render = jest.fn(() => {
      const host = document.getElementById('mainContent')
      host.innerHTML = `<div class="section-inner">${renderFeedback()}</div>`
    })

    render()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('setSearchFilterFromInput preserves focus and caret after render', () => {
    const input = document.getElementById('feedbackSearch')
    input.value = 'abc'
    input.focus()
    input.setSelectionRange(2, 2)

    window.feedbackApp.setSearchFilterFromInput(input)

    jest.runOnlyPendingTimers()

    const replacement = document.getElementById('feedbackSearch')
    expect(document.activeElement).toBe(replacement)
    expect(replacement.selectionStart).toBe(2)
    expect(replacement.selectionEnd).toBe(2)
    expect(window.feedbackDataManager.state.filter.search).toBe('abc')
  })
})
