# UI Components & Patterns

## Modal Dialogs
All modals live in `index.html`. Use the modal helper functions:

```javascript
showModal('modalId');   // Open modal
closeModal('modalId');  // Close modal
```

Modal HTML structure:
```html
<div id="modalId" class="modal hidden">
  <div class="modal-content">
    <h2>Title</h2>
    <!-- content -->
    <button onclick="closeModal('modalId')">Close</button>
  </div>
</div>
```

## Empty State
Use the `emptyState()` helper for empty data lists:

```javascript
if (data.length === 0) {
  container.innerHTML = emptyState('No items found', 'Add one to get started');
}
```

## Form Submission
Pattern for form handling:

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData);

  const { error } = await supabase
    .from('table')
    .insert([payload]);

  if (error) {
    console.error('Save failed:', error);
    return;
  }

  closeModal('modalId');
});
```

## Button States
- **Primary**: `.btn-primary`
- **Secondary**: `.btn-secondary`
- **Danger**: `.btn-danger`
- **Disabled**: `.btn:disabled`

All styles in `core/css/components.css`.

## Table Rendering
Use consistent table patterns with:
- Header row with column names
- Data rows with proper escaping (`esc()`)
- Action buttons (edit, delete)

```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    <!-- rows go here -->
  </tbody>
</table>
```

## Cards
Use `.card` class for grouped content:

```html
<div class="card">
  <h3>Title</h3>
  <p>Content here</p>
</div>
```

## Charts
Chart.js v4.4.0 is loaded via CDN. Initialize charts:

```javascript
const ctx = document.getElementById('myChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: { /* ... */ },
  options: { /* ... */ }
});
```

Always destroy charts before re-rendering:
```javascript
if (chart) chart.destroy();
```

## Typography
- **Font**: IBM Plex Sans (body), IBM Plex Mono (code)
- **Loaded**: Google Fonts (see `index.html`)
- **CSS Variables**: Color and spacing defined in `core/css/main.css`

## Guide Modal
All user-facing guide content lives in `utils/js/guide.js` as the `GUIDE_CONTENT` dictionary. A single shared modal shell (`modalGuide`) in `index.html` is populated dynamically by `showGuide(key)`.

**Rule: whenever a feature is added or changed on a content page, update the matching `GUIDE_CONTENT` entry for that page.**

To update an existing guide entry:
```javascript
// In utils/js/guide.js — find the relevant key and edit its body
'capacity-me': {
  title: '🧑‍🔧 ME Load Capacity — User Guide',
  body: `
    <div class="guide-section">
      <div class="guide-section-title">New Feature Name</div>
      <ul class="guide-list">
        <li>What it does and how to use it.</li>
      </ul>
    </div>
  `
}
```

To add a guide for a brand-new page:
1. Add a new key + `{ title, body }` object to `GUIDE_CONTENT` in `utils/js/guide.js`.
2. Add a guide button in the portal's header:
```javascript
`<button class="btn btn-ghost btn-sm" onclick="showGuide('your-key')" title="User Guide">❓ Guide</button>`
```

Available content keys (one per portal/tab — see `utils/js/guide.js` for the full list):
`hub`, `capacity`, `capacity-me`, `capacity-pm`, `capacity-production`, `product-development`, `npi-projects`, `npi-dashboard`, `npi-apqp`, `npi-ctq`, `npi-pfd`, `npi-pfmea`, `npi-cp`, `npi-actions`, `npi-risks`, `npi-bom`, `npi-timing`, `npi-gates`, `product-management`, `product-family-db`, `parts-database`, `production`, `production-scheduling`, `production-by-product`, `production-by-unit`, `operations`, `mcs`, `action-centre`, `feedback`.

## Accessibility
- Use semantic HTML (`<button>`, `<label>`, `<nav>`)
- Add `aria-label` to icon buttons
- Ensure color contrast meets WCAG AA (4.5:1 for text)
- Test with keyboard navigation (Tab, Enter, Esc)

## Loading States
Use loading spinners or disabled buttons during async operations:

```javascript
button.disabled = true;
button.textContent = 'Loading...';
```

Re-enable after operation completes.
