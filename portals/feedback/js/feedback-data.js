// ═══════════════════════════════════
// feedback-data.js — User Feedback data layer
// Depends on: state.js, auth.js, feedback-constants.js
// ═══════════════════════════════════

import { appState } from '../../../core/js/state.js'
import { currentUser, supabase } from '../../../core/js/supa.js'
import {
  FEEDBACK_STATUS,
  FEEDBACK_TYPES
} from './feedback-constants.js'
import {
  createRealtimeSubscription,
  removeRealtimeSubscription
} from '../../../utils/js/realtime.js'

export const feedbackDataManager = {
  state: {
    feedback: [],
    tab: 'submit',
    editingId: null,
    filter: {
      type: 'all',
      status: 'all',
      search: ''
    }
  },

  _publishChange() {
    document.dispatchEvent(new CustomEvent('feedbackDataChanged'))
  },

  async init() {
    if (!currentUser) return
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .order('date_submitted', { ascending: false })
      if (error) throw error
      this.state.feedback = data || []
      this.subscribe()
      this._publishChange()
    } catch (err) {
      console.error('User feedback load error:', err)
      this.state.feedback = []
      this._publishChange()
      throw new Error('Could not load user feedback.')
    }
  },

  subscribe() {
    if (!currentUser) return
    createRealtimeSubscription('user_feedback', 'user_feedback_channel', {
      onInsert: (newFeedback) => {
        if (!this.state.feedback.some(f => f.id === newFeedback.id)) {
          this.state.feedback.unshift(newFeedback)
          if (appState.currentSection === 'feedback') {
            this._publishChange()
          }
        }
      },
      onUpdate: (updated) => {
        const idx = this.state.feedback.findIndex(f => f.id === updated.id)
        if (idx >= 0) {
          this.state.feedback[idx] = updated
          if (appState.currentSection === 'feedback') {
            this._publishChange()
          }
        }
      },
      onDelete: (deleted) => {
        this.state.feedback = this.state.feedback.filter(f => f.id !== deleted.id)
        if (appState.currentSection === 'feedback') {
          this._publishChange()
        }
      }
    })
  },

  unsubscribe() {
    removeRealtimeSubscription('user_feedback_channel')
  },

  async addFeedback(feedbackType, title, description, page, priority) {
    if (!currentUser) throw new Error('You must be logged in to submit feedback.')

    const feedback = {
      user_id: currentUser.id,
      submitted_by: currentUser.email,
      date_submitted: new Date().toISOString(),
      page_area: page ? page.trim() : '',
      feedback_type: feedbackType || FEEDBACK_TYPES.USABILITY,
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'medium',
      status: FEEDBACK_STATUS.OPEN
    }

    try {
      const { data, error } = await supabase.from('user_feedback').insert([feedback]).select()
      if (error) throw error
      return data[0]
    } catch (err) {
      console.error('Feedback submit error:', err)
      throw new Error('Failed to submit feedback: ' + err.message)
    }
  },

  async updateFeedback(id, updates) {
    if (!currentUser) throw new Error('You must be logged in to update feedback.')

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .update(updateData)
        .eq('id', id)
        .select()
      if (error) throw error
      return data[0]
    } catch (err) {
      console.error('Feedback update error:', err)
      throw new Error('Failed to update feedback: ' + err.message)
    }
  },

  async respond(id, response, status, adminNotes) {
    if (!currentUser) throw new Error('You must be logged in to respond.')

    const updates = {
      response: response ? response.trim() : null,
      responded_by: currentUser.email,
      responded_at: new Date().toISOString(),
      status: status || this.state.feedback.find(f => f.id === id)?.status || FEEDBACK_STATUS.OPEN,
      admin_notes: adminNotes || null
    }

    return this.updateFeedback(id, updates)
  },

  async setStatus(id, status) {
    return this.updateFeedback(id, { status })
  },

  async reopen(id) {
    const updates = {
      status: FEEDBACK_STATUS.OPEN,
      response: null,
      responded_by: null,
      responded_at: null
    }
    return this.updateFeedback(id, updates)
  },

  // Admin-only: hard-delete a feedback/bug record
  async deleteFeedback(id) {
    if (!currentUser) throw new Error('You must be logged in.')
    try {
      const { error } = await supabase.from('user_feedback').delete().eq('id', id)
      if (error) throw error
      this.state.feedback = this.state.feedback.filter(f => f.id !== id)
      this._publishChange()
    } catch (err) {
      console.error('Feedback delete error:', err)
      throw new Error('Failed to delete feedback: ' + err.message)
    }
  },

  setTab(tab) {
    this.state.tab = tab
    this._publishChange()
  },

  setEditingId(id) {
    this.state.editingId = id
    this._publishChange()
  },

  setFilter(key, value) {
    this.state.filter[key] = value
    this._publishChange()
  },

  getFilteredFeedback() {
    const { feedback, filter } = this.state

    return feedback.filter(item => {
      if (filter.type !== 'all' && item.feedback_type !== filter.type) {
        return false
      }

      if (filter.status !== 'all' && item.status !== filter.status) {
        return false
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        const matchesTitle = (item.title || '').toLowerCase().includes(searchLower)
        const matchesDesc = (item.description || '').toLowerCase().includes(searchLower)
        const matchesPage = (item.page_area || '').toLowerCase().includes(searchLower)
        const matchesBy = (item.submitted_by || '').toLowerCase().includes(searchLower)

        if (!matchesTitle && !matchesDesc && !matchesPage && !matchesBy) {
          return false
        }
      }

      return true
    })
  }
}

export async function feedbackDataInit() {
  await feedbackDataManager.init()
}

export function feedbackDataSubscribe() {
  feedbackDataManager.subscribe()
}

export function feedbackDataUnsubscribe() {
  feedbackDataManager.unsubscribe()
}
