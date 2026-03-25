// ═══════════════════════════════════
// npi-components.js — Shared UI helpers for NPI modules
// Depends on: npi.js
// ═══════════════════════════════════

npi.components = npi.components || {}

npi.components.tableHeader = function(cols) {
  const cells = (cols || []).map(col => {
    const attrs = []
    if (col.className) attrs.push(` class="${col.className}"`)
    if (col.style) attrs.push(` style="${col.style}"`)
    if (col.title) attrs.push(` title="${esc(col.title)}"`)
    return `<th${attrs.join('')}>${col.label || ''}</th>`
  }).join('')
  return `<thead><tr>${cells}</tr></thead>`
}

npi.components.badge = function(value, thresholds) {
  const v = Number(value) || 0
  const low = thresholds?.low ?? 0
  const high = thresholds?.high ?? 0
  const critical = thresholds?.critical ?? Number.POSITIVE_INFINITY

  const cls = v >= critical ? 'rpn-hi' : v >= high ? 'rpn-md' : v >= low ? 'rpn-lo' : 'rpn-lo'
  return `<span class="rpn ${cls}">${v}</span>`
}

npi.components.rpnBadge = function(rpn, opts = {}) {
  const v = Number(rpn) || 0
  const idAttr = opts.id ? ` id="${opts.id}"` : ''
  const cls = v >= RPN_CRITICAL ? 'rpn-hi' : v >= RPN_HIGH ? 'rpn-md' : 'rpn-lo'
  return `<span${idAttr} class="rpn ${cls}">${opts.emptyLabel && !v ? opts.emptyLabel : v}</span>`
}

npi.components.scoreInput = function(value, handler) {
  const min = handler?.min ?? PFMEA_SCORE_MIN
  const max = handler?.max ?? PFMEA_SCORE_MAX
  const cls = handler?.className || 'cell-edit mono pfmea-score-input'
  const placeholder = handler?.placeholder ? ` placeholder="${handler.placeholder}"` : ''
  const style = handler?.style ? ` style="${handler.style}"` : ''
  const action = handler?.action ? ` data-action="${handler.action}"` : ''
  const oninput = handler?.oninput ? ` oninput="${handler.oninput}"` : ''
  const onchange = handler?.onchange ? ` onchange="${handler.onchange}"` : ''
  const extra = handler?.extra ? ` ${handler.extra}` : ''
  return `<input type="number" name="${handler?.name || 'npi_score_input'}" class="${cls}" min="${min}" max="${max}" value="${value ?? ''}"${placeholder}${style}${action}${oninput}${onchange}${extra}>`
}
