// ME Products Tab - Render Component

/**
 * Render products management table
 * @param {Array} productsArray Products
 * @param {Function} onUpdate Callback: onUpdate(idx, field, value)
 * @param {Function} onAdd Callback: onAdd()
 * @param {Function} onDelete Callback: onDelete(idx)
 * @returns {string} HTML
 */
export function meRenderProducts(productsArray, onUpdate, onAdd, onDelete) {
  const totalLoad = productsArray.reduce((sum, prod) => sum + (prod.hoursPerWeek || 0), 0).toFixed(1);

  let html = `
    <div class="me-products-container">
      <div class="me-products-header">
        <div class="me-kpi">
          <div class="me-kpi-value">${totalLoad}</div>
          <div class="me-kpi-label">hours/week support</div>
        </div>
        <button class="btn btn-primary" onclick="meOnProductAdd()">+ Add Product</button>
      </div>

      <table class="me-table">
        <colgroup>
          <col style="width: 180px;">
          <col style="width: 110px;">
          <col style="width: 110px;">
          <col style="width: 110px;">
          <col style="width: 250px;">
          <col style="width: 60px;">
        </colgroup>
        <thead>
          <tr>
            <th>Product/Fleet Name</th>
            <th>Support From</th>
            <th>Support Until</th>
            <th>Hours/Week</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>`;

  if (productsArray.length === 0) {
    html += `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);">
          No products added. Click "Add Product" to track ongoing support loads.
        </td>
      </tr>`;
  } else {
    productsArray.forEach((product, idx) => {
      html += `
        <tr>
          <td class="cell-edit" data-field="name" data-idx="${idx}" data-current="${esc(product.name)}">
            ${esc(product.name)}
          </td>
          <td class="cell-edit" data-field="supportFrom" data-idx="${idx}" data-current="${product.supportFrom}">
            ${product.supportFrom}
          </td>
          <td class="cell-edit" data-field="supportUntil" data-idx="${idx}" data-current="${product.supportUntil}">
            ${product.supportUntil}
          </td>
          <td class="cell-edit" data-field="hoursPerWeek" data-idx="${idx}" data-current="${product.hoursPerWeek}">
            ${(product.hoursPerWeek || 0).toFixed(1)}
          </td>
          <td class="cell-edit" data-field="notes" data-idx="${idx}" data-current="${esc(product.notes || '')}">
            ${esc(product.notes || '—')}
          </td>
          <td style="text-align: center;">
            <button class="btn btn-icon" onclick="meOnProductDelete(${idx})" title="Delete">×</button>
          </td>
        </tr>`;
    });
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  // Delayed event binding
  setTimeout(() => bindProductCells(), 0);

  return html;
}

/**
 * Bind inline edit handlers for product cells
 */
function bindProductCells() {
  const cells = document.querySelectorAll('.me-table .cell-edit');
  cells.forEach(cell => {
    cell.addEventListener('click', function () {
      if (this.querySelector('input')) return;

      const field = this.getAttribute('data-field');
      const idx = parseInt(this.getAttribute('data-idx'));
      const current = this.getAttribute('data-current');

      const input = document.createElement('input');
      input.type = field === 'hoursPerWeek' ? 'number' :
                   field === 'supportFrom' || field === 'supportUntil' ? 'date' : 'text';
      input.value = current;
      input.style.width = '100%';
      input.style.padding = '4px';
      if (field === 'hoursPerWeek') input.step = '0.1';

      const onBlur = () => {
        const newValue = input.value.trim();
        if (newValue !== current) {
          meOnProductUpdate(idx, field, newValue);
        }
      };

      input.addEventListener('blur', onBlur);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onBlur();
        if (e.key === 'Escape') {
          if (typeof render === 'function') render();
        }
      });

      this.innerHTML = '';
      this.appendChild(input);
      input.focus();
      input.select();
    });
  });
}

/**
 * Escape HTML special characters
 */
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
