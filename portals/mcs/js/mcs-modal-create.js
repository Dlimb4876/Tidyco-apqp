/**
 * MCS Modal — Create
 * Opens the new change request form.
 */

async function mcsShowCreateModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'mcs-modal-backdrop open';
  backdrop.id = 'mcs-form-backdrop';

  const pfmeaCauses = await mcsGetPfmeaCausesForLinking();
  const emptyChange = { related_pfmea_cause_id: null };
  const pfmeaLinkingHtml = mcsBuildPfmeaLinkingSection(emptyChange, pfmeaCauses);

  const initiatedBy = (currentUser && currentUser.email) ? currentUser.email : '';
  const productOptions = (window.productsState && window.productsState.products || [])
    .map(p => {
      const display = p.part_number ? `${esc(p.name)} (${esc(p.part_number)})` : esc(p.name);
      return `<option value="${esc(p.id)}" data-name="${esc(p.name)}" data-part="${esc(p.part_number || '')}">${display}</option>`;
    }).join('');

  backdrop.innerHTML = `
    <div class="mcs-modal mcs-modal-wide" id="mcs-form-modal">
      <div class="mcs-modal-header">
        <div class="mcs-modal-ref-badge">NEW CHANGE REQUEST</div>
        <div class="mcs-modal-titles">
          <div class="mcs-modal-title">Create Change Request</div>
        </div>
        <button class="mcs-modal-close" onclick="mcsCloseModal('mcs-form-backdrop')">&times;</button>
      </div>
      <div class="mcs-modal-body">
        <div class="mcs-form-layout">
          <!-- Basic Information -->
          <section class="mcs-form-section mcs-form-section-primary">
            <div class="mcs-form-section-header">
              <span class="mcs-form-section-number">1</span>
              <div class="mcs-form-section-title-wrap">
                <div class="mcs-form-section-title">Basic Information</div>
                <div class="mcs-form-section-subtitle">Core details about the change request</div>
              </div>
            </div>
            <div class="mcs-form-row">
              <div class="mcs-field-group mcs-field-full">
                <div class="mcs-field-label">Change Title *</div>
                <input class="mcs-field-input" id="mcs-f-title" placeholder="Brief, descriptive title..." />
              </div>
            </div>
            <div class="mcs-form-row mcs-form-row-3col">
              <div class="mcs-field-group">
                <div class="mcs-field-label">Change Type *</div>
                <select class="mcs-field-select" id="mcs-f-type">
                  <option value="">Select type...</option>
                  <option>Engineering</option>
                  <option>Process</option>
                  <option>Material</option>
                  <option>Tooling</option>
                  <option>Quality</option>
                  <option>Safety</option>
                </select>
              </div>
              <div class="mcs-field-group">
                <div class="mcs-field-label">Priority *</div>
                <select class="mcs-field-select" id="mcs-f-priority">
                  <option value="">Select priority...</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div class="mcs-field-group">
                <div class="mcs-field-label">Source</div>
                <select class="mcs-field-select" id="mcs-f-source">
                  <option value="Manual">Manual</option>
                  <option value="PFMEA">PFMEA</option>
                  <option value="Risk">Risk</option>
                  <option value="Customer">Customer</option>
                  <option value="Quality">Quality</option>
                  <option value="Supply Chain">Supply Chain</option>
                </select>
              </div>
            </div>
            <div class="mcs-form-row mcs-form-row-2col">
              <div class="mcs-field-group">
                <div class="mcs-field-label">Part / Drawing No.</div>
                <select class="mcs-field-select" id="mcs-f-part">
                  <option value="">Select product...</option>
                  ${productOptions}
                </select>
              </div>
              <div class="mcs-field-group">
                <div class="mcs-field-label">Initiated By</div>
                <input class="mcs-field-input" id="mcs-f-author" value="${esc(initiatedBy)}" readonly style="background: var(--surface2); color: var(--text2);" />
              </div>
            </div>
          </section>

          <!-- Change Details -->
          <section class="mcs-form-section">
            <div class="mcs-form-section-header">
              <span class="mcs-form-section-number">2</span>
              <div class="mcs-form-section-title-wrap">
                <div class="mcs-form-section-title">Change Details</div>
                <div class="mcs-form-section-subtitle">Describe what is changing and why</div>
              </div>
            </div>
            <div class="mcs-form-row">
              <div class="mcs-field-group mcs-field-full">
                <div class="mcs-field-label">Description of Change *</div>
                <textarea class="mcs-field-textarea" id="mcs-f-description" placeholder="Describe exactly what is changing..." rows="4"></textarea>
              </div>
            </div>
            <div class="mcs-form-row">
              <div class="mcs-field-group mcs-field-full">
                <div class="mcs-field-label">Justification / Root Cause</div>
                <textarea class="mcs-field-textarea" id="mcs-f-justification" placeholder="Why is this change necessary?..." rows="3"></textarea>
              </div>
            </div>
          </section>

          <!-- Impact Assessment -->
          <section class="mcs-form-section">
            <div class="mcs-form-section-header">
              <span class="mcs-form-section-number">3</span>
              <div class="mcs-form-section-title-wrap">
                <div class="mcs-form-section-title">Impact Assessment</div>
                <div class="mcs-form-section-subtitle">Identify all areas affected by this change</div>
              </div>
            </div>
            <div class="mcs-form-row">
              <div class="mcs-impact-grid mcs-impact-grid-compact">
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-bom" /><label for="mcs-imp-bom">BOM Change</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-proc" /><label for="mcs-imp-proc">Work Instructions</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-tooling" /><label for="mcs-imp-tooling">Tooling Change</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-training" /><label for="mcs-imp-training">Training Required</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-customer" /><label for="mcs-imp-customer">Customer Notification</label></div>
              </div>
            </div>
            <div class="mcs-form-row">${pfmeaLinkingHtml}</div>
            <div class="mcs-form-row mcs-form-row-3col">
              <div class="mcs-field-group">
                <div class="mcs-field-label">Impact Estimate (hours)</div>
                <input class="mcs-field-input" id="mcs-f-impact-estimate" type="number" min="0" step="0.5" placeholder="e.g. 2.0" />
              </div>
              <div class="mcs-field-group mcs-field-expand">
                <div class="mcs-field-label">Documents Affected</div>
                <input class="mcs-field-input" id="mcs-f-docs-affected" placeholder="Drawings, SOPs, control plans..." />
              </div>
            </div>
            <div class="mcs-form-row">
              <div class="mcs-field-group mcs-field-full">
                <div class="mcs-field-label">Knock-on Effect for Other Products</div>
                <textarea class="mcs-field-textarea" id="mcs-f-knock-on" placeholder="Describe potential side effects for other products, assemblies, or programmes..." rows="2"></textarea>
              </div>
            </div>
          </section>

          <!-- Implementation & Approval -->
          <section class="mcs-form-section mcs-form-section-final">
            <div class="mcs-form-section-header">
              <span class="mcs-form-section-number">4</span>
              <div class="mcs-form-section-title-wrap">
                <div class="mcs-form-section-title">Implementation & Approval</div>
                <div class="mcs-form-section-subtitle">Schedule and route the change request</div>
              </div>
            </div>
            <div class="mcs-form-row mcs-form-row-3col">
              <div class="mcs-field-group">
                <div class="mcs-field-label">Target Implementation</div>
                <input class="mcs-field-input" id="mcs-f-target" type="date" />
              </div>
              <div class="mcs-field-group">
                <div class="mcs-field-label">Overhaul Time Impact (hours)</div>
                <input class="mcs-field-input" id="mcs-f-time-impact" type="number" min="0" step="0.5" placeholder="e.g. 4.5" />
              </div>
              <div class="mcs-field-group">
                <div class="mcs-field-label">Approver *</div>
                ${mcsApproverSelectionFieldHtml('', false)}
              </div>
            </div>
          </section>
        </div>
      </div>
      <div class="mcs-modal-footer">
        <button class="mcs-btn mcs-btn-ghost" onclick="mcsCloseModal('mcs-form-backdrop')">Cancel</button>
        <button class="mcs-btn mcs-btn-primary" onclick="mcsSaveChange()">Submit Change Request</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) mcsCloseModal('mcs-form-backdrop');
  });
}
