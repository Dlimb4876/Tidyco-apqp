# Product Management System — Comprehensive Guide

**Purpose:** Document the existing product management system to help future AI assistants and developers understand how products are created, managed, and related to NPI projects.

---

## 📋 Overview

The **Product Management System** is a lightweight product master data portal that tracks:

- **Products** (manufactured items with specifications)
- **Status lifecycle** (Tender → NPI → Production → Closed)
- **Overhaul history** (maintenance hours tracking over time)
- **Product families** (HVAC, Rotating Machines, Pneumatics, etc.)

**Location:** `portals/product-development/product-management/`

---

## 🗄️ Database Tables

### `products` Table

Stores the master product record.

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `id` | UUID | Primary key | `550e8400-e29b-41d4-a716-446655440000` |
| `user_id` | UUID | Supabase auth user ID | Current user creating/editing |
| `name` | TEXT | Product name | `"HVAC Cooling Unit Pro"` |
| `part_number` | TEXT | SKU or part code | `"HVAC-CU-PRO-2024"` |
| `family` | TEXT | Product family ID | `"hvac"` (maps to families table) |
| `customer` | TEXT | Customer name | `"Acme Corp"` |
| `work_location` | TEXT | Manufacturing location | `"Unit 2"` or `"Facility A"` |
| `current_overhaul_hours` | DECIMAL | Latest maintenance hours | `120.5` |
| `turnaround_days` | DECIMAL | Days to complete service | `14` |
| `status` | TEXT | Workflow status | `'Tender'`, `'NPI'`, `'Production'`, `'Closed'` |
| `notes` | TEXT | Free-form notes | `"Custom cooling system for..."` |
| `created_at` | TIMESTAMP | System column | Auto-set on insert |
| `updated_at` | TIMESTAMP | System column | Auto-updated on change |

**Status Values (Enum):**
```javascript
['Tender', 'NPI', 'Production', 'Closed']
```

- **Tender** → Initial bidding/quoting phase (trigger for NPI project)
- **NPI** → New Product Introduction (APQP gates in progress)
- **Production** → Released and manufacturing
- **Closed** → End of life, no longer active

---

### `overhaul_history` Table

Tracks maintenance/service hours for a product over time.

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `id` | UUID | Primary key | |
| `user_id` | UUID | Who created this record | |
| `product_id` | UUID | FK to products | |
| `overhaul_hours` | DECIMAL | Hours required for service | `120.5` |
| `effective_date` | DATE | When estimate became effective | `2024-03-01` |
| `change_reason` | TEXT | Why hours changed | `"Customer requirement update"` |
| `notes` | TEXT | Additional context | |
| `created_by_name` | TEXT | Email of creator | `user@company.com` |
| `created_at` | TIMESTAMP | System column | |
| `updated_at` | TIMESTAMP | System column | |

**Purpose:** Maintains a time-series audit trail of overhaul hour estimates. Each record represents a snapshot in time.

**Example History for Product "HVAC-CU-PRO":**
```
2024-03-14: 120.5 hours (initial quote) — by John
2024-03-10: 110.0 hours (updated) — by Sarah (customer feedback)
2024-02-28: 100.0 hours (initial estimate) — by John
```

Current `products.current_overhaul_hours` = 120.5 (latest).

---

## 📂 File Structure

```
portals/product-development/product-management/
├── js/
│   ├── products-data.js          # Data layer (CRUD, history, real-time)
│   ├── products.js               # UI rendering and event handlers
│   └── trends-chart.js           # Overhaul trends visualization
├── css/
│   └── products.css              # Styling (inline edit, tables, tabs)
└── README.md                      # (if exists) Feature documentation
```

---

## 🔄 Data Flow

### On App Launch

```javascript
launchApp() [in app.js]
    ↓
productsDataInit()
    ├─ Load all products from Supabase
    │  SELECT * FROM products ORDER BY name ASC
    │
    ├─ Load overhaul history for all products
    │  SELECT * FROM overhaul_history WHERE product_id IN (...)
    │  GROUP BY product_id
    │
    ├─ Populate productsState.products[]
    ├─ Populate productsState.history{product_id: [records]}
    │
    └─ productsDataInitRealtime()
       Subscribe to products and overhaul_history tables
```

**Result:** `productsState` object ready for UI rendering.

---

### Create New Product

```
User → Product Management Portal
    ↓
"＋ Add Product" button clicked
    ↓
showAddProductForm()
    (inline form appears)
    ↓
User: Enters name, part number, customer, family, location, hours, notes
    ↓
User: Clicks "✓" (add button)
    ↓
productsDataAddProduct({name, part_number, family, customer, ...})
    ├─ INSERT INTO products (name, part_number, family, customer, ...)
    ├─ Wait for response (single product returned)
    ├─ Add to productsState.products[]
    ├─ Sort products by name
    │
    └─ Trigger UI refresh
        renderProductsList()
```

**Status:** New products default to `status = 'active'` (or 'Tender' if specified).

---

### Edit Product

```
User: Clicks "Edit" on product row
    ↓
productsStartEdit(productId)
    ├─ Save current productId to global: productsEditingId = productId
    ├─ Switch row to inline edit mode (show input fields)
    │
    └─ renderProductsList() (re-render)

User: Modifies fields (name, status, hours, etc.)
    ├─ Text inputs: live editing
    ├─ Status: dropdown select ['Tender', 'NPI', 'Production', 'Closed']
    │
    └─ Clicks "✓" (save button)

productsSaveEdit(productId)
    ├─ Read all field values from DOM
    ├─ Call: productsDataUpdateProduct(productId, {name, status, hours, ...})
    │
    ├─ UPDATE products SET {fields} WHERE id = productId
    ├─ Wait for response
    ├─ Update productsState.products[idx]
    │
    └─ Clear productsEditingId = null
       Render normal (non-edit) mode
```

**Hook Point:** On status change to "Tender", trigger NPI project flow (Phase 0 of tendering plan).

---

### Add Overhaul History

```
User: Opens product detail
    ↓
Clicks: "Add Overhaul History" or "+ New Entry"
    ↓
showHistoryModal(productId)
    (modal with date, hours, reason, notes)
    ↓
User: Enters new overhaul_hours, effective_date, change_reason
    ↓
Clicks: "Save"
    ↓
productsDataAddHistory(productId, {overhaul_hours, effective_date, change_reason})
    ├─ INSERT INTO overhaul_history (product_id, overhaul_hours, effective_date, ...)
    ├─ Wait for response
    ├─ Add to productsState.history[productId][] (newest first)
    │
    ├─ Also: UPDATE products SET current_overhaul_hours = {new_hours}
    │         (keeps current value up-to-date)
    │
    └─ Trigger chart refresh (trends visualization)
```

**Data Consistency:** `products.current_overhaul_hours` always equals the most recent `overhaul_history` entry.

---

## 📊 Real-Time Synchronization

### Subscription Channels

Two Supabase real-time subscriptions active while using Product Management:

1. **`products_channel`** — Monitors `products` table
   ```javascript
   onInsert: (row) => {
     productsDataUpsertProduct(row);
     renderProductsList();
   }
   onUpdate: (row) => {
     productsDataUpsertProduct(row);
     renderProductsList();
   }
   onDelete: (row) => {
     productsDataRemoveProduct(row.id);
     renderProductsList();
   }
   ```

2. **`overhaul_history_channel`** (implied)
   ```javascript
   onInsert: (row) => {
     // Add to productsState.history[product_id][]
     // Update trends chart
   }
   ```

**Behavior:** If User A creates/edits a product, User B sees the change immediately without page refresh.

---

## 🧠 State Management

### Global State Object

```javascript
// In state.js or products-data.js
let productsState = {
  products: [
    {
      id: "...",
      name: "HVAC Cooling Unit Pro",
      family: "hvac",
      status: "Tender",
      current_overhaul_hours: 120.5,
      ...
    },
    ...
  ],

  history: {
    "product-id-1": [
      {id: "...", overhaul_hours: 120.5, effective_date: "2024-03-14", ...},
      {id: "...", overhaul_hours: 110.0, effective_date: "2024-03-10", ...},
      ...
    ],
    "product-id-2": [...]
  },

  loaded: true
};
```

### UI State

```javascript
let productsEditingId = null;        // Which product row is being edited?
let productsActiveTab = 'list';      // 'list' | 'trends' | 'families'
let productsPortalListenerRoot = null; // DOM reference for event delegation
```

---

## 🎨 UI Components

### Product List Table

Columns (left to right):
1. **Name** — Product name (clickable for detail)
2. **Part Number** — SKU or code
3. **Family** — Product family label
4. **Location** — Work area/facility
5. **Customer** — Customer name
6. **Overhaul Hours** — Current maintenance hours (right-aligned)
7. **Turnaround Days** — Service duration estimate (right-aligned)
8. **Notes** — Free-form notes (truncated, tooltip on hover)
9. **Status** — Badge with color coding (Tender=amber, NPI=blue, Production=green, Closed=gray)
10. **Actions** — Edit/Delete buttons

**Inline Editing:**
- Click "Edit" → Row becomes editable (input fields appear)
- Click "✓" → Save changes
- Click "✕" → Cancel (revert)

**Search:**
- Text input filters by: name, part number, customer (real-time)

---

### Overhaul Trends Tab

**Chart Type:** Line chart showing hours over time

**X-Axis:** Effective date
**Y-Axis:** Overhaul hours

**Data:** All `overhaul_history` records for selected product, sorted by effective_date

**Use Case:** Visualize how maintenance estimates have changed over a product's lifecycle.

---

### Product Families Tab

Lists all product families from `families` data layer, with usage counts.

**Columns:**
1. Icon
2. Family name
3. Usage count (how many products use this family)

**Interaction:** Click family to view/edit PFMEA templates (links to family-templates-data.js).

---

## 🔗 Integration Points

### Product → NPI Project (Tendering Feature)

**Trigger:** When product status changes to "Tender"

```javascript
// In products-data.js::productsDataUpdateProduct()

async function productsDataUpdateProduct(productId, updates) {
  // ... existing code ...

  // NEW: Check if status changed to "Tender"
  if (updates.status === 'Tender' && oldProduct.status !== 'Tender') {
    // HOOK: Trigger NPI project creation flow
    productTenderStatusTriggered(productId, updates);
    // This opens New Project modal with pre-filled product data
  }

  // ... rest of update ...
}
```

**Data Passed to NPI:**
- Product ID
- Product name
- Customer
- Family (maps to NPI project family)
- Part number (optional, may become project unit field)

**Next Step:** User selects gate questions in NPI project creation (Phase 3 of tendering plan).

---

### Product ↔ Capacity Planning (ME)

Products may be referenced in ME Capacity planning:
- Capacity dashboard shows "Products in Queue"
- Each product has estimated overhaul hours (from this system)
- Capacity planners use hours to estimate team load

**Query:** `productsDataGetCurrentOverhaulTime(productId)` or `productsDataGetOverhaulTimeOnDate(productId, date)`

---

### Product ↔ Product Development Portal

**Product Management is a sub-section of Product Development:**

Navigation: `#s=product-development&t=product-management`

**Related Features:**
- Product Families (same family field, see families-data.js)
- Family PFMEA Templates (templates per family)
- NPI Projects (created from tendered products)

---

## 🔐 Security (RLS)

### Row-Level Security Policies

```sql
-- Allow users to see only their own products
CREATE POLICY "Users can access their own products"
  ON products FOR ALL
  USING (auth.uid() = user_id);

-- Same for overhaul_history (inherits product ownership)
CREATE POLICY "Users can access their own history"
  ON overhaul_history FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM products WHERE id = product_id
  ));
```

**Result:** Each user sees only products they created; no cross-user data leakage.

---

## 📈 Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Load all products | O(n) | Single SELECT, typically <200 products |
| Load all histories | O(n) | Single SELECT with JOIN, typically <1000 records |
| Search by name | O(n) | Client-side filter on loaded products |
| Add product | O(1) | Single INSERT |
| Update product | O(1) | Single UPDATE |
| Delete product | O(n) | DELETE product cascades to history records |
| Add history entry | O(1) | Single INSERT + 1 UPDATE (update current_overhaul_hours) |

**Optimization:** All data loaded once on app launch; UI updates via in-memory state changes (no additional queries during normal operation).

---

## 🧪 Testing Considerations

### Data Isolation

- **Test users:** Create separate test user accounts
- **Data:** Each test user only sees their own products
- **Cleanup:** Delete test products after test runs

### Real-Time Subscription Testing

- **Scenario:** User A creates product, User B sees it immediately
- **Tools:** Two browser tabs with different users, or two different machines
- **Verification:** New product appears without page refresh

### Status Change Hook Testing

- **Scenario:** User sets product status to "Tender"
- **Expected:** NPI New Project modal opens automatically
- **Verification:** Modal displays product pre-fill (name, customer, family)

### Overhaul History Integrity

- **Scenario:** Add history entry with hours = 120.5
- **Expected:** `products.current_overhaul_hours` updated to 120.5
- **Verification:** Product row shows new hours; history list shows new entry

---

## 🛠️ Common Modifications

### Add New Product Field

**Example:** Add `external_id` field to link to external ERP system

```javascript
// 1. Supabase: Add column to products table
ALTER TABLE products ADD COLUMN external_id TEXT;

// 2. products-data.js: Update productsDataAddProduct()
const newProduct = {
  ...
  external_id: product.external_id || '',
  ...
};

// 3. products.js: Add input field in add/edit form
<input id="pEdit-externalId" value="${p.external_id || ''}" />

// 4. products.js: Read field in save function
external_id: document.getElementById('pEdit-externalId')?.value.trim()
```

---

### Extend Status Values

**Example:** Add "Archived" status

```javascript
// 1. products.js: Update buildStatusOptions()
return ['Tender', 'NPI', 'Production', 'Archived', 'Closed'].map(...)

// 2. (Optional) Add color styling for 'Archived' badge
// In products.css: .badge-Archived { background: #999; }

// 3. products-data.js: Add filter if needed
const activeProducts = productsState.products.filter(p => p.status !== 'Archived');
```

---

### Add Product Export/Import

**Example:** Export products to CSV

```javascript
function exportProductsCSV() {
  const products = productsDataGetAll();
  const csv = convertArrayToCSV(products);
  downloadFile(csv, 'products.csv', 'text/csv');
}
```

---

## 📚 Related Documentation

- **CLAUDE.md** — Project architecture, state management, common mistakes
- **FAMILY_TEMPLATES_ARCHITECTURE.md** — Family PFMEA templates (related feature)
- **NPI_TENDERING_FEATURE_PLAN.md** — How products trigger NPI project creation
- **Database Schema** — Supabase console for table definitions

---

## 🤔 FAQ for Future AI

**Q: Where do products get created?**
A: In the Product Management portal (`product-development/product-management/`). Users click "＋ Add Product" and fill inline form.

**Q: How is a product linked to an NPI project?**
A: When product status is set to "Tender", it triggers the NPI project creation flow (see NPI_TENDERING_FEATURE_PLAN.md). Link is implicit (product name matches project name) or explicit (optional product_id FK).

**Q: Why track overhaul hours in history?**
A: Estimates change over time as customer requirements are clarified. History provides audit trail and trends visualization.

**Q: What happens if I delete a product?**
A: Product record deleted, overhaul_history records cascade-deleted (via RLS). NPI projects referencing that product remain unchanged (no FK constraint).

**Q: How do products relate to families?**
A: Product has a `family` field (ID reference). Family defines PFMEA templates. When NPI project is created from product, it inherits the family's gate templates.

**Q: Can multiple users edit the same product simultaneously?**
A: Yes. Last-write-wins (normal Supabase behavior). Both users see the update in real-time via subscription.

**Q: What's the difference between `status` and `state`?**
A: `status` is workflow state (Tender/NPI/Production/Closed). There is no separate state field; status is the workflow indicator.

---

## 🚀 Future Enhancements (Out of Scope)

- Product versioning (v1.0, v1.1, v2.0)
- Product comparison (compare overhaul hours, specs)
- Bulk import/export
- Product attachment storage (PDFs, drawings)
- Customer portal (read-only access to their products)
- Supplier/manufacturer integration
- Cost tracking (materials, labor)
- Quality metrics (defect rates, RPN trends)

---

**Last Updated:** 2026-03-14
**Status:** Reference documentation for current system
**Audience:** AI assistants, future developers, system integrators
