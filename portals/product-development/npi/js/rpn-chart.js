import { prog } from '../../../core/js/state.js';

// ── Shared: RPN Burndown Chart ──────────────────────────────────────
export function renderRpnBurndown(compact) {
  const p = prog();
  if (!p.pfmea || p.pfmea.length === 0) {
    return compact ? '' : `<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">No PFMEA rows yet — add failure modes to see RPN chart.</div>`;
  }

  let totalOriginal = 0;
  let totalCurrent  = 0;
  let rowCount      = 0;
  let rowsImproved  = 0;

  p.pfmea.forEach(mode => {
    (mode.effects || []).forEach(ef => {
      const sev = ef.sev || 1;
      (ef.causes || []).forEach(ca => {
        const curOcc     = ca.occ || 1;
        const curDet     = ca.det || 1;
        const currentRPN = sev * curOcc * curDet;
        let   originalRPN = currentRPN;
        if (ca.history && ca.history.length > 0) {
          originalRPN = ca.history[0].rpn || currentRPN;
        }
        totalOriginal += originalRPN;
        totalCurrent  += currentRPN;
        rowCount++;
        if (currentRPN < originalRPN) rowsImproved++;
      });
    });
  });

  if (rowCount === 0) {
    return compact ? '' : `<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">No cause rows found.</div>`;
  }

  const reduction = totalOriginal > 0 ? Math.round((1 - totalCurrent / totalOriginal) * 100) : 0;
  const maxRPN    = Math.max(totalOriginal, totalCurrent, 1);

  const vbW    = 1000;
  const labelW = compact ? 0 : 130;
  const chartX = compact ? 0 : labelW;
  const chartW = vbW - chartX - 60;
  const barH   = compact ? 32 : 40;
  const gap    = compact ? 16 : 20;
  const svgH   = barH * 2 + gap + (compact ? 0 : 28);

  const origBarW = Math.round((totalOriginal / maxRPN) * chartW);
  const currBarW = Math.round((totalCurrent  / maxRPN) * chartW);

  let bars = '';
  if (!compact) {
    bars += `<text x="${labelW - 8}" y="${barH / 2 + 5}" text-anchor="end" font-size="12" font-weight="600" fill="var(--mid)" font-family="IBM Plex Sans,sans-serif">Original</text>`;
    bars += `<text x="${labelW - 8}" y="${barH + gap + barH / 2 + 5}" text-anchor="end" font-size="12" font-weight="600" fill="var(--mid)" font-family="IBM Plex Sans,sans-serif">Current</text>`;
  }
  bars += `<rect x="${chartX}" y="0" width="${origBarW}" height="${barH}" rx="4" fill="#94a3b8" opacity="0.5"/>`;
  bars += `<text x="${chartX + origBarW + 8}" y="${barH / 2 + 5}" font-size="${compact ? 14 : 16}" font-weight="700" fill="var(--mid)" font-family="IBM Plex Mono,monospace">${totalOriginal}</text>`;
  const currFill = totalCurrent < totalOriginal ? '#22c55e' : totalCurrent === totalOriginal ? '#94a3b8' : '#ef4444';
  bars += `<rect x="${chartX}" y="${barH + gap}" width="${currBarW}" height="${barH}" rx="4" fill="${currFill}" opacity="0.7"/>`;
  bars += `<text x="${chartX + currBarW + 8}" y="${barH + gap + barH / 2 + 5}" font-size="${compact ? 14 : 16}" font-weight="700" fill="${currFill}" font-family="IBM Plex Mono,monospace">${totalCurrent}</text>`;

  if (!compact && reduction !== 0) {
    const reductionText = reduction > 0 ? `▼ ${reduction}% reduction` : `▲ ${Math.abs(reduction)}% increase`;
    const reductionCol  = reduction > 0 ? '#22c55e' : '#ef4444';
    bars += `<text x="${chartX}" y="${barH * 2 + gap + 22}" font-size="11" font-weight="600" fill="${reductionCol}" font-family="IBM Plex Sans,sans-serif">${reductionText} · ${rowsImproved}/${rowCount} causes improved</text>`;
  }

  return `<svg viewBox="0 0 ${vbW} ${svgH}" style="width:100%; height:auto; max-height:${compact ? 72 : 100}px; display:block;">${bars}</svg>`;
}
