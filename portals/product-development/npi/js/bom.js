import { prog, save, BOM_TYPES, bomSubTab, setBomSubTab, kitPickTarget, setKitPickTarget, kitPickSelected, setKitPickSelected, kitPickFilter, setKitPickFilter, bomPickSelected, setBomPickSelected, bomPickFilter, setBomPickFilter } from '../../../core/js/state.js';
import { esc, emptyState, showModal, closeModal } from '../../../utils/js/helpers.js';
import { refreshBomPickModal } from './apqp.js';

function goHome() { navigate('project'); }

// ═══════════════════════════════════
// bom.js — Bill of Materials and Kit builder
// Depends on: state.js, helpers.js, navigation.js, apqp.js (refreshBomPickModal, setBomFilter, toggleBomPick)
// ═══════════════════════════════════

export function renderBOM() {
  const p    = prog();
  const tabs = [
    { id: 'parts', label: '🔩 Parts',        count: p.bom.parts.length },
    { id: 'tools', label: '🔧 Tools',        count: p.bom.tools.length },
    { id: 'equip', label: '⚙️ Equipment',    count: p.bom.equip.length },
    { id: 'mat',   label: '📦 Materials',    count: p.bom.mat.length   },
    { id: 'cons',  label: '🧴 Consumables',  count: p.bom.cons.length  },
    { id: 'kits',  label: '📦 Kits',         count: p.bom.kits.length  },
  ];
  const tabHTML = `<div class="bom-subnav">${
    tabs.map(t => `<button class="bom-tab${bomSubTab === t.id ? ' active' : ''}" onclick="setBomTab('${t.id}')">${t.label} <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:inherit;opacity:.7">(${t.count})</span></button>`).join('')
  }</div>`;

  const content = bomSubTab === 'kits' ? renderKits(p) : renderBomTable(bomSubTab, p);
  return `<div class="sec-head"><div><div class="sec-eyebrow">Bill of Materials</div><div class="sec-title">📦 BoM &amp; Kits</div><div class="sec-desc">Master item registers and kit builder. Link items to PFD steps via ＋ Resource.</div></div><div style="display:flex;gap:8px;flex-shrink:0"><button class="btn btn-ghost btn-sm" onclick="goHome()">← Dashboard</button></div></div>${tabHTML}${content}`;
}

export function setBomTab(t) { setBomSubTab(t); render(); }

export function renderBomTable(type, p) {
  const items   = p.bom[type];
  const t       = BOM_TYPES[type];
  const aaw     = items.filter(x => x.isAaw).length;
  const rep     = items.filter(x => x.isRepair).length;
  const statsHTML = `<div style="display:flex;gap:8px;margin-bottom:14px">
    <span class="flag" style="background:var(--bg);border:1px solid var(--line);color:var(--mid)">${items.length} total</span>
    ${type !== 'tools' && type !== 'equip' ? `<span class="flag flag-aaw">${aaw} AAW</span><span class="flag flag-repair">${rep} Repair</span>` : ''}
  </div>`;

  let thead = '', tbody = '';
  if (type === 'parts') {
    thead = `<tr><th>Part Number</th><th>Description</th><th>Qty</th><th>Unit</th><th>Std</th><th>AAW</th><th>Repair</th><th>Notes</th><th></th></tr>`;
    tbody = items.map((r, i) => `<tr>
      <td class="w110"><input class="cell-edit mono" value="${esc(r.pn)}" onchange="updBom('parts',${i},'pn',this.value)" placeholder="PN"></td>
      <td><input class="cell-edit" value="${esc(r.desc)}" onchange="updBom('parts',${i},'desc',this.value)" placeholder="Description"></td>
      <td class="w50 ctr"><input type="number" class="cell-edit mono" min="0" value="${r.qty || ''}" onchange="updBom('parts',${i},'qty',+this.value)"></td>
      <td class="w50"><input class="cell-edit" value="${esc(r.unit)}" onchange="updBom('parts',${i},'unit',this.value)" placeholder="ea"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isStd    ? 'checked' : ''} onchange="updBom('parts',${i},'isStd',this.checked)"    style="accent-color:var(--green);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isAaw    ? 'checked' : ''} onchange="updBom('parts',${i},'isAaw',this.checked)"    style="accent-color:var(--amber);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isRepair ? 'checked' : ''} onchange="updBom('parts',${i},'isRepair',this.checked)" style="accent-color:var(--rose);width:15px;height:15px;cursor:pointer"></td>
      <td><input class="cell-edit" value="${esc(r.notes)}" onchange="updBom('parts',${i},'notes',this.value)" placeholder="Notes / scheme ref"></td>
      <td class="w28 ctr"><button class="del-btn" onclick="delBom('parts',${i})">×</button></td>
    </tr>`).join('');
  } else if (type === 'tools') {
    thead = `<tr><th>Tool ID</th><th>Description</th><th>Spec / PN</th><th>Notes</th><th></th></tr>`;
    tbody = items.map((r, i) => `<tr>
      <td class="w100"><input class="cell-edit mono" value="${esc(r.toolId)}" onchange="updBom('tools',${i},'toolId',this.value)" placeholder="TL-001"></td>
      <td><input class="cell-edit" value="${esc(r.desc)}" onchange="updBom('tools',${i},'desc',this.value)" placeholder="Description"></td>
      <td class="w140"><input class="cell-edit mono" value="${esc(r.spec)}" onchange="updBom('tools',${i},'spec',this.value)" placeholder="Spec / PN"></td>
      <td><input class="cell-edit" value="${esc(r.notes)}" onchange="updBom('tools',${i},'notes',this.value)" placeholder="Notes"></td>
      <td class="w28 ctr"><button class="del-btn" onclick="delBom('tools',${i})">×</button></td>
    </tr>`).join('');
  } else if (type === 'equip') {
    thead = `<tr><th>Equip ID</th><th>Description</th><th>Location</th><th>Notes</th><th></th></tr>`;
    tbody = items.map((r, i) => `<tr>
      <td class="w100"><input class="cell-edit mono" value="${esc(r.equipId)}" onchange="updBom('equip',${i},'equipId',this.value)" placeholder="EQ-001"></td>
      <td><input class="cell-edit" value="${esc(r.desc)}" onchange="updBom('equip',${i},'desc',this.value)" placeholder="Description"></td>
      <td class="w140"><input class="cell-edit" value="${esc(r.location)}" onchange="updBom('equip',${i},'location',this.value)" placeholder="Bay / location"></td>
      <td><input class="cell-edit" value="${esc(r.notes)}" onchange="updBom('equip',${i},'notes',this.value)" placeholder="Notes"></td>
      <td class="w28 ctr"><button class="del-btn" onclick="delBom('equip',${i})">×</button></td>
    </tr>`).join('');
  } else {
    thead = `<tr><th>Part / Cat. No.</th><th>Description</th><th>Unit</th><th>Qty/Unit</th><th>Std</th><th>AAW</th><th>Repair</th><th>Notes</th><th></th></tr>`;
    tbody = items.map((r, i) => `<tr>
      <td class="w100"><input class="cell-edit mono" value="${esc(r.pn)}" onchange="updBom('${type}',${i},'pn',this.value)" placeholder="PN"></td>
      <td><input class="cell-edit" value="${esc(r.desc)}" onchange="updBom('${type}',${i},'desc',this.value)" placeholder="Description"></td>
      <td class="w60"><input class="cell-edit" value="${esc(r.unit)}" onchange="updBom('${type}',${i},'unit',this.value)" placeholder="kg/L/m"></td>
      <td class="w70 ctr"><input type="number" class="cell-edit mono" min="0" step="0.01" value="${r.qtyPerUnit || ''}" onchange="updBom('${type}',${i},'qtyPerUnit',+this.value)"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isStd    ? 'checked' : ''} onchange="updBom('${type}',${i},'isStd',this.checked)"    style="accent-color:var(--green);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isAaw    ? 'checked' : ''} onchange="updBom('${type}',${i},'isAaw',this.checked)"    style="accent-color:var(--amber);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isRepair ? 'checked' : ''} onchange="updBom('${type}',${i},'isRepair',this.checked)" style="accent-color:var(--rose);width:15px;height:15px;cursor:pointer"></td>
      <td><input class="cell-edit" value="${esc(r.notes)}" onchange="updBom('${type}',${i},'notes',this.value)" placeholder="Notes"></td>
      <td class="w28 ctr"><button class="del-btn" onclick="delBom('${type}',${i})">×</button></td>
    </tr>`).join('');
  }

  return `${statsHTML}<div class="card" style="overflow-x:auto">
  <div class="card-head"><span class="card-title">${t.icon} ${t.label} Register</span><span class="card-meta">${items.length} items</span><button class="btn btn-primary btn-sm" onclick="addBomRow('${type}')">＋ Add ${t.label.replace(/s$/, '')}</button></div>
  ${items.length === 0 ? emptyState(t.icon, 'No ' + t.label.toLowerCase() + ' yet', 'Click ＋ Add to start. Link items to PFD steps using ＋ Resource.') : `<table class="tbl" style="min-width:800px"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`}
  <button class="add-row" onclick="addBomRow('${type}')">＋ Add ${t.label.replace(/s$/, '')}</button></div>`;
}

export function addBomRow(type) {
  const p = prog();
  let item = { id: 'bom_' + Date.now() };
  if (type === 'parts') item = { ...item, pn: '', desc: '', qty: 1, unit: 'ea', isStd: false, isAaw: false, isRepair: false, notes: '' };
  else if (type === 'tools') item = { ...item, toolId: '', desc: '', spec: '', notes: '' };
  else if (type === 'equip') item = { ...item, equipId: '', desc: '', location: '', notes: '' };
  else item = { ...item, pn: '', desc: '', unit: '', qtyPerUnit: 0, isStd: false, isAaw: false, isRepair: false, notes: '' };
  p.bom[type].push(item); save(); render();
  setTimeout(() => { const tbl = document.querySelector('.card table'); if (tbl) { const rows = tbl.querySelectorAll('tbody tr'); if (rows.length > 0) rows[rows.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 50);
}
export function updBom(type, i, f, v) { prog().bom[type][i][f] = v; save(); }
export function delBom(type, i) { const item = prog().bom[type][i]; prog().pfd.forEach(s => s.bomRefs = (s.bomRefs || []).filter(r => !(r.bomType === type && r.itemId === item.id))); prog().bom[type].splice(i, 1); save(); render(); }

// ══════════════════════════════════════
// KITS
// ══════════════════════════════════════
export function renderKits(p) {
  const kits     = p.bom.kits;
  const allItems = [];
  Object.entries(BOM_TYPES).forEach(([k, t]) => { p.bom[k].forEach(item => { allItems.push({ bomType: k, item, t }); }); });
  const totalItems = allItems.length;

  const kitCards = kits.map((kit, ki) => {
    const totalBomRefs = kit.items.length;
    const summary = Object.entries(BOM_TYPES).map(([k, t]) => { const n = kit.items.filter(r => r.bomType === k).length; return n > 0 ? `${t.icon} ${n} ${t.label.toLowerCase()}` : null; }).filter(Boolean).join(' · ');
    const kitRows = kit.items.map((ref, ri) => {
      const bt   = p.bom[ref.bomType]; if (!bt) return '';
      const item = bt.find(x => x.id === ref.itemId); if (!item) return '';
      const t    = BOM_TYPES[ref.bomType];
      const name = item.desc || (item.pn || item.toolId || item.equipId || '?');
      const pn   = item.pn || item.toolId || item.equipId || '';
      const flags = [];
      if (item.isAaw)    flags.push('<span class="flag flag-aaw">AAW</span>');
      if (item.isRepair) flags.push('<span class="flag flag-repair">RPR</span>');
      const typeBg  = { parts: 'var(--blue-pale)', tools: 'var(--navy-pale)', equip: 'var(--amber-pale)', mat: 'var(--green-pale)', cons: 'var(--red-pale)' }[ref.bomType];
      const typeCol = { parts: 'var(--blue)',      tools: 'var(--navy)',      equip: 'var(--amber)',      mat: 'var(--green)',      cons: 'var(--red)'      }[ref.bomType];
      return `<div class="kit-item-row">
        <span class="kit-item-type" style="background:${typeBg};color:${typeCol}">${t.icon} ${t.label}</span>
        <span class="kit-item-name">${esc(name)}</span>
        ${pn ? `<span class="kit-item-pn">${esc(pn)}</span>` : ''}
        <div style="display:flex;gap:3px">${flags.join('')}</div>
        <input class="kit-qty-input" type="number" min="0" step="0.01" value="${ref.qty || 1}" onchange="updKitItem(${ki},${ri},'qty',+this.value)" title="Quantity">
        <span class="kit-unit">${item.unit || 'ea'}</span>
        <button class="del-btn" onclick="delKitItem(${ki},${ri})">×</button>
      </div>`;
    }).join('');
    return `<div class="kit-card">
      <div class="kit-header">
        <span style="font-size:20px">📦</span>
        <input class="kit-name-input" value="${esc(kit.name)}" onchange="updKit(${ki},'name',this.value)" placeholder="Kit name (e.g. Overhaul Kit, Fastener Kit…)">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);margin-left:auto">${totalBomRefs} items</span>
        <button class="del-btn" onclick="delKit(${ki})" style="margin-left:8px">×</button>
      </div>
      <div class="kit-body">
        ${kitRows || `<div class="kit-empty">No items yet — click Add Items to build this kit</div>`}
      </div>
      <div class="kit-summary">${summary || 'Empty kit'}</div>
      <button class="kit-add-btn" onclick="openKitPick(${ki})">＋ Add Items from BoM</button>
    </div>`;
  }).join('');

  return `<div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:13px;color:var(--muted)">${kits.length} kit${kits.length !== 1 ? 's' : ''} · ${totalItems} total BoM items available</div>
    <button class="btn btn-primary btn-sm" onclick="addKit()">＋ New Kit</button>
  </div>
  ${kits.length === 0
    ? `<button class="new-kit-btn" onclick="addKit()">＋ Create your first kit<div style="font-size:12px;margin-top:4px;color:var(--muted)">e.g. Overhaul Kit, Fastener Kit, Bearing Kit, Repair Kit A…</div></button>`
    : `<div class="kit-list">${kitCards}</div>`}`;
}

export function addKit()                    { prog().bom.kits.push({ id: 'kit_' + Date.now(), name: '', items: [] }); save(); render(); }
export function updKit(ki, f, v)            { prog().bom.kits[ki][f] = v; save(); }
export function delKit(ki)                  { prog().bom.kits.splice(ki, 1); save(); render(); }
export function updKitItem(ki, ri, f, v)    { prog().bom.kits[ki].items[ri][f] = v; save(); }
export function delKitItem(ki, ri)          { prog().bom.kits[ki].items.splice(ri, 1); save(); render(); }

export function openKitPick(ki) {
  setKitPickTarget(ki);
  const p   = prog();
  const kit = p.bom.kits[ki];
  const selected = kit.items.map(r => r.bomType + '|' + r.itemId);
  setKitPickSelected(selected);
  setKitPickFilter('all');
  setBomPickSelected([...selected]);
  setBomPickFilter('all');
  refreshBomPickModal(p, 'kitPickFilter', 'kitPickList', 'all');
  showModal('modalKitPick');
}
export function saveKitPick() {
  const p   = prog();
  const kit = p.bom.kits[kitPickTarget];
  const existing = {};
  kit.items.forEach(r => { existing[r.bomType + '|' + r.itemId] = r.qty; });
  kit.items = bomPickSelected.map(key => { const [bt, id] = key.split('|'); return { bomType: bt, itemId: id, qty: existing[key] || 1 }; });
  save(); closeModal('modalKitPick'); render();
}
