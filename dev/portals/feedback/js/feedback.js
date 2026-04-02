// ═══════════════════════════════════
// feedback.js — Feedback & Bug Reports portal renderer
// Depends on: feedback-data.js, feedback-constants.js, helpers.js, navigation.js
// ═══════════════════════════════════

import { appState } from '../../../core/js/state.js'
import { currentUser } from '../../../core/js/supa.js'
import { esc, isAdmin, preserveInputCaretAfterRender } from '../../../utils/js/helpers.js'
import { showGuide } from '../../../utils/js/guide.js'
import { render } from '../../../utils/js/navigation.js'
import {
  FEEDBACK_STATUS_CONFIG,
  FEEDBACK_TYPES,
  getFeedbackPriorityConfig,
  getFeedbackStatusConfig,
  getFeedbackTypeConfig
} from './feedback-constants.js'
import {
  feedbackDataManager,
  feedbackDataSubscribe as feedbackDataSubscribeState,
  feedbackDataUnsubscribe as feedbackDataUnsubscribeState
} from './feedback-data.js'

let feedbackDelegationContainer = null

function feedbackRefreshContent() {
  const inner = document.querySelector('#mainContent .section-inner')
  if (!inner) return
  inner.innerHTML = renderFeedback()
  setupFeedbackDelegation()
}

document.addEventListener('feedbackDataChanged', () => {
  if (appState.currentSection === 'feedback') {
    feedbackRefreshContent()
  }
})

function feedbackSwitchTab(tab) {
  feedbackDataManager.setTab(tab)
}

function feedbackSetFilter(key, value) {
  feedbackDataManager.setFilter(key, value)
}

function feedbackSetSearchFilterFromInput(inputEl) {
  const value = inputEl ? inputEl.value : ''
  if (!inputEl || typeof preserveInputCaretAfterRender !== 'function') {
    feedbackDataManager.setFilter('search', value)
    return
  }

  preserveInputCaretAfterRender(inputEl, () => {
    feedbackDataManager.setFilter('search', value)
  }, {
    replacementSelector: '#feedbackSearch'
  })
}

function feedbackGetSelectedType() {
  const selected = document.querySelector('input[name="feedbackTypeSelect"]:checked')
  return selected ? selected.value : FEEDBACK_TYPES.USABILITY
}

function feedbackShowInlineMessage(message, type, element) {
  if (!element) return
  element.textContent = message
  element.className = `feedback-form-feedback feedback-form-feedback-${type}`
  element.style.display = 'block'
}

async function feedbackSubmitInline() {
  const feedbackType = feedbackGetSelectedType()
  const pageInput = document.getElementById('feedbackInlinePage')
  const titleInput = document.getElementById('feedbackInlineTitle')
  const descInput = document.getElementById('feedbackInlineDesc')
  const priorityInput = document.querySelector('input[name="feedbackPriority"]:checked')
  const feedbackEl = document.getElementById('feedbackInlineFeedback')

  const page = pageInput ? pageInput.value.trim() : ''
  const title = titleInput ? titleInput.value.trim() : ''
  const description = descInput ? descInput.value.trim() : ''
  const priority = priorityInput ? priorityInput.value : 'medium'

  if (!title) {
    feedbackShowInlineMessage('Please enter a title.', 'error', feedbackEl)
    return
  }

  if (!description) {
    feedbackShowInlineMessage('Please enter a description.', 'error', feedbackEl)
    return
  }

  try {
    await feedbackDataManager.addFeedback(feedbackType, title, description, page, priority)
    if (pageInput) pageInput.value = ''
    if (titleInput) titleInput.value = ''
    if (descInput) descInput.value = ''
    feedbackShowInlineMessage('✓ Feedback submitted successfully!', 'success', feedbackEl)
    setTimeout(() => {
      if (feedbackEl) feedbackEl.style.display = 'none'
      feedbackSwitchTab('browse')
    }, 2000)
  } catch (error) {
    feedbackShowInlineMessage(error.message, 'error', feedbackEl)
  }
}

function feedbackStartEditing(id) {
  feedbackDataManager.setEditingId(id)
}

function feedbackCancelEditing() {
  feedbackDataManager.setEditingId(null)
}

async function feedbackSaveResponse(id, idx) {
  const textarea = document.getElementById(`feedbackResponseText_${idx}`)
  const statusSelect = document.getElementById(`feedbackStatusSelect_${idx}`)
  const adminNotesInput = document.getElementById(`feedbackAdminNotes_${idx}`)

  if (!textarea || !statusSelect) {
    console.error(`saveResponse: Could not find elements for idx=${idx}`)
    return
  }

  const response = textarea.value.trim()
  const status = statusSelect.value
  const adminNotes = adminNotesInput ? adminNotesInput.value.trim() : ''

  if (!response && status === 'open') {
    alert('Please enter a response or change the status.')
    return
  }

  try {
    await feedbackDataManager.respond(id, response, status, adminNotes)
    feedbackDataManager.setEditingId(null)
  } catch (error) {
    console.error('Save response error:', error)
    alert(error.message)
  }
}

async function feedbackSetStatus(id, newStatus) {
  try {
    await feedbackDataManager.setStatus(id, newStatus)
  } catch (error) {
    alert(error.message)
  }
}

async function feedbackReopen(id) {
  try {
    await feedbackDataManager.reopen(id)
  } catch (error) {
    alert(error.message)
  }
}

async function feedbackDelete(id) {
  if (!confirm('Delete this feedback? This cannot be undone.')) return
  try {
    await feedbackDataManager.deleteFeedback(id)
  } catch (error) {
    alert(error.message)
  }
}

function feedbackGetStats(feedback) {
  const bugs = feedback.filter(f => f.feedback_type === FEEDBACK_TYPES.BUG)
  const feedbackItems = feedback.filter(f => f.feedback_type !== FEEDBACK_TYPES.BUG)

  return {
    total: feedback.length,
    bugs: bugs.length,
    openBugs: bugs.filter(b => b.status === 'open').length,
    feedback: feedbackItems.length,
    openFeedback: feedbackItems.filter(f => f.status === 'open').length
  }
}

function feedbackRenderSubmitTab() {
  const today = new Date().toLocaleDateString('en-GB')
  const email = currentUser ? currentUser.email : ''

  return `
    <div class="feedback-form-container">
      <div class="feedback-form-box">
        <div class="feedback-form-title">Submit Feedback or Bug Report</div>
        <div class="feedback-form-sub">Help us improve by sharing your experience</div>

        <div class="feedback-type-selector">
          <label class="feedback-type-label">
            <input type="radio" name="feedbackTypeSelect" value="${FEEDBACK_TYPES.BUG}" checked>
            <span class="feedback-type-option">
              <span class="feedback-type-icon">🐛</span>
              <span class="feedback-type-text">
                <span class="feedback-type-name">Bug Report</span>
                <span class="feedback-type-desc">Report a technical issue</span>
              </span>
            </span>
          </label>
          <label class="feedback-type-label">
            <input type="radio" name="feedbackTypeSelect" value="${FEEDBACK_TYPES.USABILITY}">
            <span class="feedback-type-option">
              <span class="feedback-type-icon">💡</span>
              <span class="feedback-type-text">
                <span class="feedback-type-name">Usability Feedback</span>
                <span class="feedback-type-desc">Suggest UX improvements</span>
              </span>
            </span>
          </label>
          <label class="feedback-type-label">
            <input type="radio" name="feedbackTypeSelect" value="${FEEDBACK_TYPES.FEATURE_REQUEST}">
            <span class="feedback-type-option">
              <span class="feedback-type-icon">✨</span>
              <span class="feedback-type-text">
                <span class="feedback-type-name">Feature Request</span>
                <span class="feedback-type-desc">Request new capability</span>
              </span>
            </span>
          </label>
          <label class="feedback-type-label">
            <input type="radio" name="feedbackTypeSelect" value="${FEEDBACK_TYPES.IMPROVEMENT}">
            <span class="feedback-type-option">
              <span class="feedback-type-icon">🔧</span>
              <span class="feedback-type-text">
                <span class="feedback-type-name">Improvement</span>
                <span class="feedback-type-desc">Enhance existing features</span>
              </span>
            </span>
          </label>
        </div>

        <div class="field">
          <label for="feedbackSubmittedBy">Submitted By</label>
          <input type="text" id="feedbackSubmittedBy" name="feedback_submitted_by" value="${esc(email)}" readonly class="feedback-readonly-field">
        </div>

        <div class="field">
          <label for="feedbackSubmittedDate">Date</label>
          <input type="text" id="feedbackSubmittedDate" name="feedback_submitted_date" value="${today}" readonly class="feedback-readonly-field">
        </div>

        <div class="field">
          <label for="feedbackInlinePage">Page / Area</label>
          <input type="text" id="feedbackInlinePage" placeholder="e.g. PFMEA, Capacity Planning, Production Scheduling…">
        </div>

        <div class="field">
          <label for="feedbackInlineTitle">Title *</label>
          <input type="text" id="feedbackInlineTitle" placeholder="Brief summary of your feedback">
        </div>

        <div class="field">
          <label>Priority</label>
          <div class="feedback-priority-selector">
            <label class="feedback-priority-label">
              <input type="radio" name="feedbackPriority" value="low">
              <span class="feedback-priority-option feedback-priority-low">Low</span>
            </label>
            <label class="feedback-priority-label">
              <input type="radio" name="feedbackPriority" value="medium" checked>
              <span class="feedback-priority-option feedback-priority-medium">Medium</span>
            </label>
            <label class="feedback-priority-label">
              <input type="radio" name="feedbackPriority" value="high">
              <span class="feedback-priority-option feedback-priority-high">High</span>
            </label>
          </div>
        </div>

        <div class="field">
          <label for="feedbackInlineDesc">Description *</label>
          <textarea id="feedbackInlineDesc" placeholder="Describe your feedback in detail…" rows="6" style="resize:vertical"></textarea>
        </div>

        <div class="feedback-form-actions">
          <button class="btn btn-primary" data-feedback-action="submit">Submit</button>
          <div class="feedback-form-feedback" id="feedbackInlineFeedback" style="display:none"></div>
        </div>
      </div>
    </div>
  `
}

function feedbackRowHTML(f, i) {
  const { editingId } = feedbackDataManager.state
  const date = f.date_submitted ? new Date(f.date_submitted).toLocaleDateString('en-GB') : '—'
  const typeConfig = getFeedbackTypeConfig(f.feedback_type)
  const statusConfig = getFeedbackStatusConfig(f.status)
  const priorityConfig = getFeedbackPriorityConfig(f.priority)
  const isEditing = editingId === f.id
  const isClosed = statusConfig.isClosed

  const typeCell = `
    <span class="feedback-type-badge" style="background: ${typeConfig.badgeColor}20; color: ${typeConfig.badgeColor}">
      ${typeConfig.icon} ${typeConfig.label}
    </span>
  `

  const statusCell = isEditing
    ? `<select id="feedbackStatusSelect_${i}" class="feedback-inline-select">
        ${Object.entries(FEEDBACK_STATUS_CONFIG).map(([key, config]) =>
          `<option value="${key}" ${f.status === key ? 'selected' : ''}>${config.label}</option>`
        ).join('')}
      </select>`
    : `<span class="feedback-badge ${statusConfig.badgeClass}">${statusConfig.label}</span>`

  const priorityCell = `
    <span class="feedback-priority-badge" style="color: ${priorityConfig.color}">
      ${priorityConfig.label}
    </span>
  `

  let responseCell
  if (isEditing) {
    responseCell = `
      <textarea id="feedbackResponseText_${i}" class="feedback-inline-textarea" placeholder="Enter response...">${esc(f.response || '')}</textarea>
      <textarea id="feedbackAdminNotes_${i}" class="feedback-inline-textarea feedback-admin-notes" placeholder="Admin notes (optional)">${esc(f.admin_notes || '')}</textarea>
    `
  } else {
    responseCell = f.response
      ? `<div class="feedback-response-text">${esc(f.response)}</div><div class="feedback-response-meta">— ${esc(f.responded_by || '')}${f.responded_at ? ', ' + new Date(f.responded_at).toLocaleDateString('en-GB') : ''}</div>`
      : '<span class="feedback-muted">—</span>'
  }

  const deleteBtn = isAdmin()
    ? `<button class="btn btn-xs btn-danger" data-feedback-action="delete" data-id="${esc(f.id)}" title="Delete">✕</button>`
    : ''

  const actionBtn = isEditing
    ? `<div class="feedback-inline-actions">
        <button class="btn btn-xs btn-primary" data-feedback-action="save" data-id="${esc(f.id)}" data-idx="${i}">Save</button>
        <button class="btn btn-xs btn-ghost" data-feedback-action="cancel">Cancel</button>
      </div>`
    : (isClosed
      ? `<button class="btn btn-sm btn-ghost feedback-reopen-btn" data-feedback-action="reopen" data-id="${esc(f.id)}">Re-open</button>`
      : `<button class="btn btn-sm btn-ghost" data-feedback-action="edit" data-id="${esc(f.id)}">Edit</button>`)

  return `
    <tr class="${isClosed ? 'feedback-row-closed' : ''} ${typeConfig.rowClass || ''}">
      <td class="feedback-col-num"><span class="feedback-row-num">${i + 1}</span></td>
      <td class="feedback-col-type">${typeCell}</td>
      <td class="feedback-col-title">
        <div class="feedback-title-text">${esc(f.title)}</div>
        <div class="feedback-desc-preview">${esc(f.description)}</div>
      </td>
      <td class="feedback-col-date feedback-muted">${date}</td>
      <td class="feedback-col-page">${f.page_area ? esc(f.page_area) : '<span class="feedback-muted">—</span>'}</td>
      <td class="feedback-col-priority">${priorityCell}</td>
      <td class="feedback-col-status">${statusCell}</td>
      <td class="feedback-col-response">${responseCell}</td>
      <td class="feedback-col-action"><div class="feedback-action-cell">${actionBtn}${deleteBtn}</div></td>
    </tr>
  `
}

function feedbackRenderBrowseTab(feedback) {
  const filtered = feedbackDataManager.getFilteredFeedback()
  const { filter } = feedbackDataManager.state

  return `
    <div class="feedback-filters">
      <div class="feedback-filter-group">
        <label for="feedbackFilterType">Type</label>
        <select id="feedbackFilterType" class="feedback-filter-select" name="feedback_filter_type" data-feedback-action="filter-type">
          <option value="all" ${filter.type === 'all' ? 'selected' : ''}>All Types</option>
          <option value="bug" ${filter.type === 'bug' ? 'selected' : ''}>🐛 Bugs</option>
          <option value="usability" ${filter.type === 'usability' ? 'selected' : ''}>💡 Usability</option>
          <option value="feature_request" ${filter.type === 'feature_request' ? 'selected' : ''}>✨ Features</option>
          <option value="improvement" ${filter.type === 'improvement' ? 'selected' : ''}>🔧 Improvements</option>
        </select>
      </div>
      <div class="feedback-filter-group">
        <label for="feedbackFilterStatus">Status</label>
        <select id="feedbackFilterStatus" class="feedback-filter-select" name="feedback_filter_status" data-feedback-action="filter-status">
          <option value="all" ${filter.status === 'all' ? 'selected' : ''}>All Status</option>
          <option value="open" ${filter.status === 'open' ? 'selected' : ''}>Open</option>
          <option value="in_review" ${filter.status === 'in_review' ? 'selected' : ''}>In Review</option>
          <option value="planned" ${filter.status === 'planned' ? 'selected' : ''}>Planned</option>
          <option value="in_progress" ${filter.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="completed" ${filter.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="declined" ${filter.status === 'declined' ? 'selected' : ''}>Declined</option>
          <option value="squashed" ${filter.status === 'squashed' ? 'selected' : ''}>Squashed</option>
        </select>
      </div>
      <div class="feedback-filter-group feedback-filter-search">
        <label for="feedbackSearch">Search</label>
        <input type="text" id="feedbackSearch" class="feedback-search-input" placeholder="Search title, description, page…"
          value="${esc(filter.search || '')}" data-feedback-action="filter-search">
      </div>
    </div>

    ${filtered.length === 0 ? `
      <div class="feedback-empty">
        <div class="feedback-empty-icon">📋</div>
        <div class="feedback-empty-text">No feedback found</div>
        <div class="feedback-empty-sub">Try adjusting your filters or switch to "Submit" to add one</div>
      </div>
    ` : `
      <div class="feedback-results-bar">Showing <span class="feedback-results-count">${filtered.length}</span> of ${feedback.length} item${feedback.length !== 1 ? 's' : ''}</div>
      <div class="feedback-table-wrap">
        <table class="feedback-table">
          <thead>
            <tr>
              <th class="feedback-col-num">#</th>
              <th class="feedback-col-type">Type</th>
              <th class="feedback-col-title">Title</th>
              <th class="feedback-col-date">Date</th>
              <th class="feedback-col-page">Page</th>
              <th class="feedback-col-priority">Priority</th>
              <th class="feedback-col-status">Status</th>
              <th class="feedback-col-response">Response</th>
              <th class="feedback-col-action"></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((f, i) => feedbackRowHTML(f, i)).join('')}
          </tbody>
        </table>
      </div>
    `}
  `
}

export function renderFeedback() {
  const { feedback, tab } = feedbackDataManager.state
  const openCount = feedback.filter(f => !getFeedbackStatusConfig(f.status).isClosed).length
  const stats = feedbackGetStats(feedback)

  return `
    <div id="feedback-container">
      <div class="feedback-header">
        <div>
          <div class="feedback-title">💬 Feedback & Bugs</div>
          <div class="feedback-sub">${feedback.length} submission${feedback.length !== 1 ? 's' : ''} · ${openCount} open</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div class="feedback-stats-bar">
            <span class="feedback-stat">📊 ${stats.total} total</span>
            <span class="feedback-stat-sep">·</span>
            <span class="feedback-stat">🐛 ${stats.bugs} bug${stats.bugs !== 1 ? 's' : ''} (${stats.openBugs} open)</span>
            <span class="feedback-stat-sep">·</span>
            <span class="feedback-stat">💡 ${stats.feedback} feedback (${stats.openFeedback} open)</span>
          </div>
          <button class="btn btn-ghost btn-sm" data-feedback-action="show-guide" title="User Guide">❓ Guide</button>
        </div>
      </div>

      <div class="feedback-tabs">
        <button class="feedback-tab ${tab === 'submit' ? 'feedback-tab-active' : ''}" data-feedback-action="tab-submit">
          ✍️ Submit
        </button>
        <button class="feedback-tab ${tab === 'browse' ? 'feedback-tab-active' : ''}" data-feedback-action="tab-browse">
          📋 Browse All
        </button>
      </div>

      ${tab === 'submit' ? feedbackRenderSubmitTab() : feedbackRenderBrowseTab(feedback)}
    </div>
  `
}

function setupFeedbackDelegation() {
  const container = document.getElementById('feedback-container')
  if (!container || feedbackDelegationContainer === container) return
  feedbackDelegationContainer = container

  container.addEventListener('click', async (event) => {
    const actionEl = event.target.closest('[data-feedback-action]')
    if (!actionEl || !container.contains(actionEl)) return
    const action = actionEl.dataset.feedbackAction

    if (action === 'show-guide') {
      showGuide('feedback')
      return
    }
    if (action === 'tab-submit') {
      feedbackSwitchTab('submit')
      return
    }
    if (action === 'tab-browse') {
      feedbackSwitchTab('browse')
      return
    }
    if (action === 'submit') {
      await feedbackSubmitInline()
      return
    }
    if (action === 'edit') {
      feedbackStartEditing(actionEl.dataset.id || '')
      return
    }
    if (action === 'cancel') {
      feedbackCancelEditing()
      return
    }
    if (action === 'save') {
      const id = actionEl.dataset.id || ''
      const idx = Number(actionEl.dataset.idx || '-1')
      await feedbackSaveResponse(id, idx)
      return
    }
    if (action === 'reopen') {
      await feedbackReopen(actionEl.dataset.id || '')
      return
    }
    if (action === 'delete') {
      await feedbackDelete(actionEl.dataset.id || '')
    }
  })

  container.addEventListener('change', async (event) => {
    const actionEl = event.target.closest('[data-feedback-action]')
    if (!actionEl || !container.contains(actionEl)) return
    const action = actionEl.dataset.feedbackAction

    if (action === 'filter-type') {
      feedbackSetFilter('type', actionEl.value)
      return
    }
    if (action === 'filter-status') {
      feedbackSetFilter('status', actionEl.value)
      return
    }
    if (action === 'status-inline') {
      await feedbackSetStatus(actionEl.dataset.id || '', actionEl.value)
    }
  })

  container.addEventListener('input', (event) => {
    const actionEl = event.target.closest('[data-feedback-action]')
    if (!actionEl || !container.contains(actionEl)) return
    if (actionEl.dataset.feedbackAction === 'filter-search') {
      feedbackSetSearchFilterFromInput(actionEl)
    }
  })
}

// Called immediately after render() creates #feedback-container so tab clicks work
// before the async data load completes
export function feedbackAttachDelegation() {
  setupFeedbackDelegation()
}

export async function feedbackDataSubscribe() {
  await feedbackDataManager.init()
  feedbackDataSubscribeState()
  setupFeedbackDelegation()
}

export function feedbackDataUnsubscribe() {
  feedbackDataUnsubscribeState()
  feedbackDelegationContainer = null
}
