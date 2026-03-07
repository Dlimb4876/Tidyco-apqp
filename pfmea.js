/* ============================================================
   pfmea.js — PFMEA render, mutations, and RPN logic
   Depends on: prog(), save(), render(), esc()  (main file globals)
   ============================================================ */

// ══════════════════════════════════════
// PFMEA — grouped by PFD step, multi-row per step
// ══════════════════════════════════════
function renderPFMEA(){
  const p=prog();
  const sorted=sortedPfd(p.pfd).filter(s=>s.type!=='group');
  if(sorted.length===0)return emptyState('⚠️','No process steps','Add steps in Process Flow first.');

  // Migrate old flat/previous structure
  p.pfmea.forEach(r=>{
    if(!r._type){
      r._type='mode';
      r.effects=[{
        id:'e_'+Math.random().toString(36).slice(2),
        effect:r.effect||'',sev:r.sev||1,
        causes:[{
          id:'c_'+Math.random().toString(36).slice(2),
          cause:r.cause||'',occ:r.occ||1,det:r.det||1,
          prevent:r.controls||'',detect:'',
          action:{desc:'',owner:'',due:'',newOcc:'',newDet:''},
          history:[]
        }]
      }];
      delete r.effect;delete r.cause;delete r.sev;delete r.occ;delete r.det;delete r.controls;delete r.action;
    }
    // Migrate causes missing new fields
    (r.effects||[]).forEach(ef=>{
      (ef.causes||[]).forEach(ca=>{
        if(!ca.prevent)ca.prevent='';
        if(!ca.detect)ca.detect='';
        if(!ca.action)ca.action={desc:'',taken:'',owner:'',due:'',newOcc:'',newDet:''};
        if(!('taken' in ca.action))ca.action.taken='';
        if(!ca.history)ca.history=[];
      });
      // migrate old effect-level controls/action to first cause
      if(ef.controls!==undefined){
        if(ef.causes&&ef.causes[0]&&!ef.causes[0].prevent)ef.causes[0].prevent=ef.controls||'';
        delete ef.controls;
      }
      if(ef.action!==undefined){
        if(ef.causes&&ef.causes[0])ef.causes[0].action={desc:ef.action||'',owner:'',due:'',newOcc:'',newDet:''};
        delete ef.action;
      }
    });
  });

  const highRPN=p.pfmea.reduce((n,m)=>n+(m.effects||[]).reduce((en,ef)=>en+(ef.causes||[]).filter(ca=>(ef.sev||1)*(ca.occ||1)*(ca.det||1)>=100).length,0),0);

  const byStep={};sorted.forEach(s=>{byStep[s.id]=[];});byStep['__none']=[];
  p.pfmea.forEach(r=>{const key=(r.pfdId&&byStep[r.pfdId]!==undefined)?r.pfdId:'__none';byStep[key].push(r);});

  // Columns: Failure Mode | Effect | SEV | Cause | OCC | Prevent | Detect | DET | RPN | Action/Owner/Due | New OCC | New DET | Forecast | ▶ | del
  let html=`<div class="sticky-table-wrap" style="-webkit-overflow-scrolling:touch"><table class="tbl pfmea-tbl" style="table-layout:fixed;min-width:1808px;width:100%">
  <colgroup>
    <col style="width:180px"><!-- failure mode -->
    <col style="width:180px"><!-- effect -->
    <col style="width:44px"> <!-- SEV -->
    <col style="width:180px"><!-- cause -->
    <col style="width:44px"> <!-- OCC -->
    <col style="width:180px"><!-- prevent -->
    <col style="width:180px"><!-- detect -->
    <col style="width:44px"> <!-- DET -->
    <col style="width:60px"> <!-- RPN -->
    <col style="width:150px"><!-- recommended action -->
    <col style="width:150px"><!-- action taken -->
    <col style="width:80px"> <!-- owner -->
    <col style="width:100px"><!-- due -->
    <col style="width:44px"> <!-- new OCC -->
    <col style="width:44px"> <!-- new DET -->
    <col style="width:60px"> <!-- forecast -->
    <col style="width:60px"> <!-- implement -->
    <col style="width:28px"> <!-- del -->
  </colgroup>
  <thead>
    <tr>
      <th rowspan="2">Failure Mode</th>
      <th rowspan="2">Effect</th>
      <th rowspan="2" title="Severity of effect">SEV</th>
      <th rowspan="2">Cause</th>
      <th rowspan="2" title="Occurrence of cause">OCC</th>
      <th rowspan="2">Controls — Prevent</th>
      <th rowspan="2">Controls — Detect</th>
      <th rowspan="2" title="Detection rating">DET</th>
      <th rowspan="2">RPN</th>
      <th colspan="8" style="background:#dbeafe;color:#1e40af;letter-spacing:.5px">RECOMMENDED ACTION &amp; RESCORING</th>
      <th rowspan="2"></th>
    </tr>
    <tr class="pfmea-thead-row2">
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Recommended<br>Action</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Action<br>Taken</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Owner</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Due</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">New<br>OCC</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">New<br>DET</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Forecast<br>RPN</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Implement</th>
    </tr>
  </thead><tbody>`;

  sorted.forEach(s=>{
    const modes=byStep[s.id]||[];
    const ctqBadges=(s.ctqIds||[]).map(cid=>{const ci=p.ctq.findIndex(c=>c.id===cid);return ci>=0?`<span class="tag tag-ctq" style="font-size:9px">C${ci+1}</span>`:''}).join(' ');
    html+=`<tr><td colspan="18" style="padding:0;border-top:3px solid #6b7280"><div class="pfmea-step-header"><span class="pfmea-step-label">Step ${s.stepNum} — ${esc(s.op||'(unnamed)')}</span><div class="pfmea-step-ctqs">${ctqBadges}</div></div></td></tr>`;

    if(modes.length===0){
      html+=`<tr class="pfmea-row-sub"><td colspan="17" style="padding:8px 14px;color:var(--muted);font-size:12px;font-style:italic">No failure modes yet</td><td></td></tr>`;
    }

    modes.forEach(mode=>{
      const mi=p.pfmea.indexOf(mode);
      const effects=mode.effects||[];
      const totalCauseRows=effects.reduce((n,ef)=>n+Math.max(1,(ef.causes||[]).length),0);
      const modeRowspan=Math.max(1,totalCauseRows);

      effects.forEach((ef,ei)=>{
        const causes=ef.causes||[];
        const efRowspan=Math.max(1,causes.length);

        causes.forEach((ca,ci)=>{
          const sev=ef.sev||1,occ=ca.occ||1,det=ca.det||1;
          const rpn=sev*occ*det;
          const rpnCls=rpn>=200?'rpn-hi':rpn>=100?'rpn-md':'rpn-lo';
          const act=ca.action||{};
          const newOcc=+act.newOcc||occ;
          const newDet=+act.newDet||det;
          const forecast=sev*newOcc*newDet;
          const fCls=forecast>=200?'rpn-hi':forecast>=100?'rpn-md':'rpn-lo';
          const hasAction=act.desc||act.newOcc||act.newDet;
          const hist=ca.history||[];

          // History row (hidden by default)
          const histRows=hist.length?[...hist].reverse().map(h=>{
            const oc=h.rpn>=200?'rpn-hi':h.rpn>=100?'rpn-md':'rpn-lo';
            const nc=(h.newRpn||0)>=200?'rpn-hi':(h.newRpn||0)>=100?'rpn-md':'rpn-lo';
            const occDown=h.newOcc<h.oldOcc, detDown=h.newDet<h.oldDet;
            return`<div style="font-size:10px;border-bottom:1px solid var(--line);padding:6px 0;line-height:1.6">
              <div style="display:flex;align-items:center;gap:5px">
                <span class="rpn ${oc}" style="font-size:11px;padding:2px 7px">${h.rpn}</span>
                <span style="color:var(--muted)">→</span>
                <span class="rpn ${nc}" style="font-size:11px;padding:2px 7px">${h.newRpn??'—'}</span>
                <span style="color:var(--muted);font-size:9px;margin-left:auto">${h.date}</span>
              </div>
              ${(h.oldOcc||h.oldDet)?`<div style="color:var(--muted);font-size:9px;margin-top:2px">
                OCC <b>${h.oldOcc??'—'}</b>→<b style="color:${occDown?'#16a34a':'#dc2626'}">${h.newOcc??'—'}</b>
                &nbsp;·&nbsp;
                DET <b>${h.oldDet??'—'}</b>→<b style="color:${detDown?'#16a34a':'#dc2626'}">${h.newDet??'—'}</b>
              </div>`:''}
              <div style="color:var(--mid);font-size:10px;margin-top:3px;font-style:italic">"${esc(h.desc)}"</div>
            </div>`;
          }).join(''):'<span style="font-size:10px;color:var(--muted);font-style:italic">No history yet</span>';

          let rowHtml=`<tr class="pfmea-row-sub">`;

          // Mode cell — first effect, first cause only
          if(ei===0&&ci===0){
            rowHtml+=`<td rowspan="${modeRowspan}" class="pfmea-mode-cell" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdMode(${mi},'mode',this.value)" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
              <div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap">
                <button class="add-row" style="font-size:9px;padding:1px 6px" onclick="pfAddEffect(${mi})">＋ Effect</button>
                <button class="del-btn" onclick="pfDelMode(${mi})" style="font-size:9px">× Mode</button>
              </div>
            </td>`;
          }

          // Effect + SEV — first cause of each effect only
          if(ci===0){
            rowHtml+=`<td rowspan="${efRowspan}" class="pfmea-effect-cell" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdEffect(${mi},${ei},'effect',this.value)" placeholder="Effect of failure" style="width:100%">${esc(ef.effect)}</textarea>
              <div style="margin-top:2px;display:flex;gap:3px;flex-wrap:wrap">
                <button class="add-row" style="font-size:9px;padding:1px 6px" onclick="pfAddCause(${mi},${ei})">＋ Cause</button>
                ${effects.length>1?`<button class="del-btn" onclick="pfDelEffect(${mi},${ei})" style="font-size:9px">× Effect</button>`:''}
              </div>
            </td>
            <td rowspan="${efRowspan}" class="pfmea-effect-cell" style="text-align:center;vertical-align:middle">
              <div style="font-size:8px;color:var(--muted);margin-bottom:2px">SEV</div>
              <input type="number" class="cell-edit mono" min="1" max="10" value="${sev}" onchange="pfUpdEffect(${mi},${ei},'sev',+this.value);pfLiveRPN(${mi},${ei},-1)" style="width:30px;text-align:center;font-weight:700;font-size:13px">
            </td>`;
          }

          // Cause row — always rendered
          rowHtml+=`
            <td class="pfmea-cause-cell pfmea-cause-text" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdCause(${mi},${ei},${ci},'cause',this.value)" placeholder="Cause of failure" style="width:100%">${esc(ca.cause)}</textarea>
              ${causes.length>1?`<button class="del-btn" onclick="pfDelCause(${mi},${ei},${ci})" style="font-size:9px">× Cause</button>`:''}
            </td>
            <td class="pfmea-cause-cell" style="text-align:center;vertical-align:middle">
              <div style="font-size:8px;color:var(--muted);margin-bottom:2px">OCC</div>
              <input type="number" class="cell-edit mono" min="1" max="10" value="${occ}" onchange="pfUpdCause(${mi},${ei},${ci},'occ',+this.value);pfLiveRPN(${mi},${ei},${ci})" style="width:30px;text-align:center;font-weight:700;font-size:13px">
            </td>
            <td class="pfmea-cause-cell" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdCause(${mi},${ei},${ci},'prevent',this.value)" placeholder="How do we prevent this cause?" style="width:100%;font-size:11px">${esc(ca.prevent||'')}</textarea>
            </td>
            <td class="pfmea-cause-cell" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdCause(${mi},${ei},${ci},'detect',this.value)" placeholder="How do we detect this cause?" style="width:100%;font-size:11px">${esc(ca.detect||'')}</textarea>
            </td>
            <td class="pfmea-cause-cell" style="text-align:center;vertical-align:middle">
              <div style="font-size:8px;color:var(--muted);margin-bottom:2px">DET</div>
              <input type="number" class="cell-edit mono" min="1" max="10" value="${det}" onchange="pfUpdCause(${mi},${ei},${ci},'det',+this.value);pfLiveRPN(${mi},${ei},${ci})" style="width:30px;text-align:center;font-weight:700;font-size:13px">
            </td>
            <td class="pfmea-cause-cell" style="text-align:center;vertical-align:middle">
              <span id="rpn_${mi}_${ei}_${ci}" class="rpn ${rpnCls}">${rpn}</span>
              ${hist.length?`<div style="margin-top:3px"><button onclick="pfShowHist(event,'${ca.id}')" style="font-size:9px;background:none;border:1px solid var(--line2);border-radius:3px;cursor:pointer;padding:1px 4px;color:var(--muted)">▶ ${hist.length}</button></div>`:''}              <div id="hist_${ca.id}" class="hist-popup" style="display:none">                <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase;border-bottom:1px solid var(--line);padding-bottom:4px">Action History</div>                ${histRows}                <div style="text-align:center;padding-top:6px;font-size:9px;color:var(--muted)">${hist.length} action${hist.length!==1?'s':''} logged</div>              </div>
            </td>
            <!-- Action zone -->
            <td class="pfmea-cause-cell" style="vertical-align:top;background:#f0f5ff">
              <textarea class="cell-edit" onchange="pfUpdCauseAction(${mi},${ei},${ci},'desc',this.value)" placeholder="Recommended action…" style="width:100%;font-size:11px;background:transparent">${esc(act.desc||'')}</textarea>
            </td>
            <td class="pfmea-cause-cell" style="vertical-align:top;background:#f0f5ff">
              <textarea class="cell-edit" onchange="pfUpdCauseAction(${mi},${ei},${ci},'taken',this.value)" placeholder="What was done…" style="width:100%;font-size:11px;background:transparent;color:#1e40af">${esc(act.taken||'')}</textarea>
            </td>
            <td class="pfmea-cause-cell" style="vertical-align:top;background:#f0f5ff">
              <input class="cell-edit" value="${esc(act.owner||'')}" onchange="pfUpdCauseAction(${mi},${ei},${ci},'owner',this.value)" placeholder="Owner" style="width:100%;font-size:11px;background:transparent">
            </td>
            <td class="pfmea-cause-cell" style="vertical-align:top;background:#f0f5ff">
              <input type="date" class="cell-edit" value="${act.due||''}" onchange="pfUpdCauseAction(${mi},${ei},${ci},'due',this.value)" style="width:100%;font-size:10px;background:transparent">
            </td>
            <td class="pfmea-cause-cell" style="text-align:center;vertical-align:middle;background:#f0f5ff">
              <div style="font-size:8px;color:#6b7280;margin-bottom:2px">OCC</div>
              <input type="number" class="cell-edit mono" min="1" max="10" value="${act.newOcc||''}" onchange="pfUpdCauseAction(${mi},${ei},${ci},'newOcc',this.value);pfLiveForecast(${mi},${ei},${ci})" placeholder="—" style="width:30px;text-align:center;background:transparent;font-size:12px">
            </td>
            <td class="pfmea-cause-cell" style="text-align:center;vertical-align:middle;background:#f0f5ff">
              <div style="font-size:8px;color:#6b7280;margin-bottom:2px">DET</div>
              <input type="number" class="cell-edit mono" min="1" max="10" value="${act.newDet||''}" onchange="pfUpdCauseAction(${mi},${ei},${ci},'newDet',this.value);pfLiveForecast(${mi},${ei},${ci})" placeholder="—" style="width:30px;text-align:center;background:transparent;font-size:12px">
            </td>
            <td class="pfmea-cause-cell" style="text-align:center;vertical-align:middle;background:#f0f5ff">
              <span id="forecast_${mi}_${ei}_${ci}" class="rpn ${fCls}" style="opacity:${hasAction?1:0}">${hasAction?forecast:'—'}</span>
            </td>
            <td class="pfmea-cause-cell" style="text-align:center;vertical-align:middle;background:#f0f5ff">
              ${hasAction?`<button onclick="pfImplementAction(${mi},${ei},${ci})" style="font-size:10px;font-weight:700;background:#1e40af;color:white;border:none;border-radius:4px;padding:3px 7px;cursor:pointer;white-space:nowrap" title="Implement — write new scores to PFMEA">▶ Apply</button>`:`<span style="color:var(--muted);font-size:10px">—</span>`}
            </td>
            <td style="text-align:center;vertical-align:top;padding-top:6px"></td>
          </tr>`;
          html+=rowHtml;
        });

        // Effect with no causes
        if(causes.length===0){
          let rowHtml=`<tr class="pfmea-row-sub">`;
          if(ei===0){
            rowHtml+=`<td rowspan="${modeRowspan}" class="pfmea-mode-cell" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdMode(${mi},'mode',this.value)" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
              <div style="margin-top:4px;display:flex;gap:3px">
                <button class="add-row" style="font-size:9px;padding:1px 6px" onclick="pfAddEffect(${mi})">＋ Effect</button>
                <button class="del-btn" onclick="pfDelMode(${mi})" style="font-size:9px">× Mode</button>
              </div>
            </td>`;
          }
          rowHtml+=`<td class="pfmea-effect-cell" style="vertical-align:top">
            <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdEffect(${mi},${ei},'effect',this.value)" placeholder="Effect of failure" style="width:100%">${esc(ef.effect)}</textarea>
            <button class="add-row" style="font-size:9px;padding:1px 6px;margin-top:2px" onclick="pfAddCause(${mi},${ei})">＋ Cause</button>
          </td>
          <td class="pfmea-effect-cell" style="text-align:center;vertical-align:middle">
            <div style="font-size:8px;color:var(--muted);margin-bottom:2px">SEV</div>
            <input type="number" class="cell-edit mono" min="1" max="10" value="${ef.sev||1}" onchange="pfUpdEffect(${mi},${ei},'sev',+this.value)" style="width:30px;text-align:center;font-weight:700;font-size:13px">
          </td>
          <td colspan="15" style="color:var(--muted);font-size:11px;font-style:italic;padding:8px">No causes yet — click ＋ Cause</td>
          </tr>`;
          html+=rowHtml;
        }
      });

      // Mode with no effects
      if(effects.length===0){
        html+=`<tr class="pfmea-row-sub">
          <td class="pfmea-mode-cell" style="vertical-align:top">
            <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdMode(${mi},'mode',this.value)" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
            <div style="margin-top:4px;display:flex;gap:3px">
              <button class="add-row" style="font-size:9px;padding:1px 6px" onclick="pfAddEffect(${mi})">＋ Effect</button>
              <button class="del-btn" onclick="pfDelMode(${mi})" style="font-size:9px">× Mode</button>
            </div>
          </td>
          <td colspan="17" style="color:var(--muted);font-size:11px;font-style:italic;padding:8px">No effects yet — click ＋ Effect</td>
        </tr>`;
      }
    });

    html+=`<tr><td colspan="18" style="padding:0"><div class="pfmea-add-row" onclick="pfAddMode('${s.id}')">＋ Add failure mode for Step ${s.stepNum}</div></td></tr>`;
  });

  html+='</tbody></table></div>';

  return`<div class="sec-head"><div><div class="sec-eyebrow">Step 03</div><div class="sec-title">PFMEA</div>
    <div class="sec-desc">Failure Mode → Effect (SEV) → Cause (OCC) → Controls Prevent / Detect (DET) → RPN. Actions and rescoring per cause.</div></div>
    <div class="sec-actions">${highRPN>0?`<span class="tag tag-amber" style="align-self:center">⚠ ${highRPN} high RPN ≥100</span>`:''}</div></div>
  <div class="card">${html}</div>
  ${p.pfmea.length>0?`<div class="info-banner">💡 RPN = SEV × OCC × DET. ▶ Apply writes new scores and logs old RPN to history. Next: <a href="#" onclick="setApqpTab('cp');return false" style="color:var(--blue)">Control Plan →</a></div>`:''}`;
}

function pfShowHist(evt,cid){
  // Hide any open popups
  document.querySelectorAll('.hist-popup').forEach(p=>{if(p.id!=='hist_'+cid)p.style.display='none';});
  const el=document.getElementById('hist_'+cid);
  if(!el)return;
  if(el.style.display==='block'){el.style.display='none';return;}
  // Position near button, fixed coords
  const btn=evt.currentTarget;
  const r=btn.getBoundingClientRect();
  el.style.display='block';
  // Position below button, adjust if would go off screen
  let top=r.bottom+6;
  let left=r.left;
  if(left+304>window.innerWidth) left=window.innerWidth-310;
  if(top+400>window.innerHeight) top=r.top-Math.min(400,top+400-window.innerHeight+10);
  el.style.top=top+'px';
  el.style.left=left+'px';
  evt.stopPropagation();
}
document.addEventListener('click',()=>document.querySelectorAll('.hist-popup').forEach(p=>p.style.display='none'));

// ── PFMEA data functions ──
function pfAddMode(pfdId){
  prog().pfmea.push({id:'f_'+Date.now(),_type:'mode',pfdId,mode:'',ctqIds:[],
    effects:[{id:'e_'+Date.now(),effect:'',sev:1,controls:'',action:'',
      causes:[{id:'c_'+Date.now(),cause:'',occ:1,det:1}]}]});
  save();render();
}
function pfUpdMode(mi,f,v){prog().pfmea[mi][f]=v;save();}
function pfDelMode(mi){const fid=prog().pfmea[mi].id;prog().cp.forEach(r=>{if(r.pfmeaId===fid)r.pfmeaId='';});prog().pfmea.splice(mi,1);save();render();}
function pfAddEffect(mi){
  prog().pfmea[mi].effects.push({id:'e_'+Date.now(),effect:'',sev:1,controls:'',action:'',causes:[{id:'c_'+Date.now(),cause:'',occ:1,det:1}]});
  save();render();
}
function pfUpdEffect(mi,ei,f,v){prog().pfmea[mi].effects[ei][f]=v;save();}
function pfDelEffect(mi,ei){prog().pfmea[mi].effects.splice(ei,1);save();render();}
function pfAddCause(mi,ei){
  prog().pfmea[mi].effects[ei].causes.push({id:'c_'+Date.now(),cause:'',occ:1,det:1});
  save();render();
}
function pfUpdCause(mi,ei,ci,f,v){prog().pfmea[mi].effects[ei].causes[ci][f]=v;save();}
function pfUpdCauseAction(mi,ei,ci,f,v){
  const ca=prog().pfmea[mi].effects[ei].causes[ci];
  if(!ca.action)ca.action={desc:'',taken:'',owner:'',due:'',newOcc:'',newDet:''};
        if(!('taken' in ca.action))ca.action.taken='';
  ca.action[f]=v;save();
}
function pfImplementAction(mi,ei,ci){
  const p=prog();
  const mode=p.pfmea[mi];const ef=mode.effects[ei];const ca=ef.causes[ci];
  const act=ca.action||{};
  if(!act.desc&&!act.newOcc&&!act.newDet){alert('Add an action and/or new scores before implementing.');return;}
  const oldRpn=(ef.sev||1)*(ca.occ||1)*(ca.det||1);
  const newOcc=act.newOcc?+act.newOcc:ca.occ;
  const newDet=act.newDet?+act.newDet:ca.det;
  if(!confirm(`Implement action?

This will:
• Update OCC: ${ca.occ} → ${newOcc}
• Update DET: ${ca.det} → ${newDet}
• New RPN: ${(ef.sev||1)*newOcc*newDet}
• Log old RPN (${oldRpn}) to history
• Clear the action fields`))return;
  const newRpn=(ef.sev||1)*newOcc*newDet;
  if(!ca.history)ca.history=[];
  ca.history.push({
    rpn:oldRpn,
    newRpn:newRpn,
    date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}),
    desc:act.taken||act.desc||'Action implemented',
    oldOcc:ca.occ, oldDet:ca.det,
    newOcc:newOcc,  newDet:newDet
  });
  ca.occ=newOcc;
  ca.det=newDet;
  ca.action={desc:'',taken:'',owner:'',due:'',newOcc:'',newDet:''};
  save();render();
}
function pfDelCause(mi,ei,ci){prog().pfmea[mi].effects[ei].causes.splice(ci,1);save();render();}
function pfRefreshRPN(){save();}

function pfRpnClass(rpn){return rpn>=200?'rpn-hi':rpn>=100?'rpn-md':'rpn-lo';}
function rpnColor(rpn){
  // 1-49: green range, 50-99: amber range, 100-199: orange-red, 200+: deep red
  if(rpn<=1)  return{bg:'#dcfce7',fg:'#166534'};
  if(rpn<25)  return{bg:'#bbf7d0',fg:'#166534'};
  if(rpn<50)  return{bg:'#fef9c3',fg:'#854d0e'};
  if(rpn<100) return{bg:'#fed7aa',fg:'#9a3412'};
  if(rpn<150) return{bg:'#fca5a5',fg:'#7f1d1d'};
  if(rpn<200) return{bg:'#f87171',fg:'#fff'};
  if(rpn<300) return{bg:'#ef4444',fg:'#fff'};
  return{bg:'#991b1b',fg:'#fff'};
}

// Live-update RPN span(s) for a cause row. If ci===-1, update all causes of this effect.
function pfLiveRPN(mi,ei,ci){
  const p=prog();
  const mode=p.pfmea[mi];if(!mode)return;
  const ef=mode.effects[ei];if(!ef)return;
  const sev=ef.sev||1;
  const targets=ci===-1?(ef.causes||[]).map((_,i)=>i):[ci];
  targets.forEach(cIdx=>{
    const ca=(ef.causes||[])[cIdx];if(!ca)return;
    const rpn=sev*(ca.occ||1)*(ca.det||1);
    const el=document.getElementById(`rpn_${mi}_${ei}_${cIdx}`);
    if(el){el.textContent=rpn;el.className='rpn '+pfRpnClass(rpn);}
    pfLiveForecast(mi,ei,cIdx);
  });
  save();
}

// Live-update forecast span for one cause
function pfLiveForecast(mi,ei,ci){
  const p=prog();
  const mode=p.pfmea[mi];if(!mode)return;
  const ef=mode.effects[ei];if(!ef)return;
  const ca=(ef.causes||[])[ci];if(!ca)return;
  const act=ca.action||{};
  const sev=ef.sev||1;
  const newOcc=act.newOcc?+act.newOcc:(ca.occ||1);
  const newDet=act.newDet?+act.newDet:(ca.det||1);
  const hasAction=act.newOcc||act.newDet;
  const forecast=sev*newOcc*newDet;
  const el=document.getElementById(`forecast_${mi}_${ei}_${ci}`);
  if(el){
    el.textContent=hasAction?forecast:'—';
    el.className='rpn '+(hasAction?pfRpnClass(forecast):'rpn-lo');
    el.style.opacity=hasAction?'1':'0';
    el.style.background='';el.style.color='';
  }
  save();
}

// Legacy compat
function calcRPN(r){return(r.sev||1)*(r.occ||1)*(r.det||1);}
function addPFMEARow(pfdId){pfAddMode(pfdId);}
function updPFMEA(i,f,v){prog().pfmea[i][f]=v;save();}
function delPFMEA(i){pfDelMode(i);}
function refreshRPN(i){pfRefreshRPN();}