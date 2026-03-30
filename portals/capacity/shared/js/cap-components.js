/* ============================================================
   cap-components.js — Reusable UI Components
   ============================================================ */

import { escapeHtml } from './cap-utils.js'

export function renderKPIStrip(kpis) {
  let html = '<div class="me-kpi-strip">'

  ;(kpis || []).forEach(kpi => {
    const color = kpi.highlight || 'var(--blue)'
    html += `
      <div class="me-kpi" style="border-left: 4px solid ${color};">
        <div class="me-kpi-value">${escapeHtml(String(kpi.value))}</div>
        <div class="me-kpi-label">${escapeHtml(kpi.label)}</div>
        <div class="me-kpi-month">${escapeHtml(kpi.note || '')}</div>
      </div>
    `
  })

  html += '</div>'
  return html
}

export function renderMonthPicker(monthKey, _onPrevClick, _onNextClick, _onChangeClick) {
  return `
    <div class="me-chart-controls">
      <button class="btn btn-secondary" data-cap-action="cap-me-prev-month">← Previous</button>
      <input type="month" id="meChartMonthInput" value="${monthKey}" data-cap-action="cap-me-month-change" />
      <button class="btn btn-secondary" data-cap-action="cap-me-next-month">Next →</button>
    </div>
  `
}

export function renderTableHeader(headers) {
  let html = '<thead><tr>'

  ;(headers || []).forEach(h => {
    const widthStyle = h.width ? `style="width:${h.width}"` : ''
    html += `<th ${widthStyle}>${escapeHtml(h.label)}</th>`
  })

  html += '</tr></thead>'
  return html
}

export function renderEditableCell(value, fieldType, _onBlurHandler, placeholder) {
  const safePlaceholder = placeholder || ''
  let html = ''

  if (fieldType === 'number') {
    html = `<input type="number" name="cap_edit_number" value="${value || 0}" step="0.5" placeholder="${safePlaceholder}">`
  } else if (fieldType === 'date') {
    html = `<input type="date" name="cap_edit_date" value="${value || ''}" placeholder="${safePlaceholder}">`
  } else {
    html = `<input name="cap_edit_text" value="${escapeHtml(value)}" placeholder="${safePlaceholder}">`
  }

  return html
}

export function renderStatusBadge(status) {
  let icon = '⚪'
  let bgColor = 'var(--muted)'

  if (status === 'Complete' || status === 'complete') {
    icon = '🟢'
    bgColor = 'var(--green)'
  } else if (status === 'In Progress' || status === 'in-progress') {
    icon = '🟡'
    bgColor = 'var(--amber)'
  } else if (status === 'Planned' || status === 'planned') {
    icon = '⚪'
    bgColor = 'var(--blue)'
  }

  return `
    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 3px; background: ${bgColor}20; font-size: 12px;">
      ${icon} ${escapeHtml(status)}
    </span>
  `
}

export function renderEmptyState(icon, title, description) {
  return `
    <div style="text-align: center; padding: 60px 20px; color: var(--muted);">
      <div style="font-size: 48px; margin-bottom: 12px;">${icon}</div>
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${escapeHtml(title)}</div>
      <div style="font-size: 13px;">${escapeHtml(description)}</div>
    </div>
  `
}

export function renderCard(title, subtitle, content, footer) {
  let html = `
    <div class="me-card">
      <div class="me-card-head">
        <span class="me-card-title">${escapeHtml(title)}</span>
  `

  if (subtitle) {
    html += `<span style="font-size:12px;color:var(--muted)">${escapeHtml(subtitle)}</span>`
  }

  html += `
      </div>
      <div class="me-card-body">
        ${content}
      </div>
  `

  if (footer) {
    html += `<div class="me-card-footer">${footer}</div>`
  }

  html += '</div>'
  return html
}

export function renderSkeleton(rows = 3, cols = 4) {
  let html = '<div style="display: flex; flex-direction: column; gap: 8px;">'

  for (let i = 0; i < rows; i++) {
    html += '<div style="display: flex; gap: 8px;">'
    for (let j = 0; j < cols; j++) {
      html += `
        <div style="
          flex: 1;
          height: 12px;
          background: linear-gradient(90deg, var(--line) 25%, rgba(255,255,255,0.2) 50%, var(--line) 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        "></div>
      `
    }
    html += '</div>'
  }

  html += '</div>'
  return html
}
