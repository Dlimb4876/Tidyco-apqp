# Product Flow Diagram — Current System (Before Tendering)

**Purpose:** Visual documentation of how products are created, managed, and currently flow through the Tidyco APQP system. This shows the **existing state** before the tendering feature is added.

**Date:** 2026-03-14
**Scope:** Current product lifecycle (no tendering feature yet)

---

## 🔄 Product Lifecycle Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   PRODUCT MANAGEMENT SYSTEM                       │
└─────────────────────────────────────────────────────────────────┘

Step 1: CREATE PRODUCT
   ├─ User: Click "＋ Add Product" in Product Management portal
   ├─ Modal: Fill in product details
   │  ├─ Name: e.g., "HVAC Cooling Unit Pro"
   │  ├─ Part Number: e.g., "HVAC-CU-PRO-2024"
   │  ├─ Customer: e.g., "Acme Corp"
   │  ├─ Family: Select from families (HVAC, Rotating, Pneumatic, Other)
   │  ├─ Location: e.g., "Unit 2"
   │  ├─ Overhaul Hours: e.g., 120.5
   │  ├─ Turnaround Days: e.g., 14
   │  └─ Notes: Free-form text
   │
   └─ INSERT INTO products (name, part_number, customer, family, ...)
      └─ Product created with status='active' (current default)

Step 2: VIEW PRODUCT LIST
   ├─ Products displayed in table format
   ├─ Columns: Name, Part #, Family, Location, Customer, Hours, Days, Status, Actions
   ├─ Sorted by: Name (A–Z)
   └─ Features:
      ├─ Search by: Name, Part #, Customer (real-time)
      ├─ View trends: Click "Trends" tab to see overhaul hours over time
      └─ View families: Click "Families" tab to see product families

Step 3: EDIT PRODUCT
   ├─ User: Click "Edit" on any product row
   ├─ Row: Converts to inline edit mode (input fields appear)
   ├─ Edit: Change any field (name, hours, location, status, notes, etc.)
   ├─ Save: Click "✓" to persist changes
   └─ UPDATE products SET {fields} WHERE id = product_id
      └─ Other users see change in real-time via subscription

Step 4: VIEW PRODUCT DETAIL (Optional)
   ├─ Click product name (future enhancement)
   └─ Shows: Full detail view + overhaul history
      ├─ History: List of all hours changes over time
      ├─ Chart: Visual trend of hours changes
      └─ Actions: Add history entry, delete product

Step 5: ADD OVERHAUL HISTORY
   ├─ User: Opens product detail
   ├─ Click: "Add Overhaul History" or "＋ New Entry"
   ├─ Modal: Fill in
   │  ├─ Overhaul Hours: New estimate (e.g., 130.0)
   │  ├─ Effective Date: When estimate applies (YYYY-MM-DD)
   │  ├─ Change Reason: Why it changed (e.g., "Customer requirement")
   │  └─ Notes: Additional context
   │
   ├─ INSERT INTO overhaul_history (product_id, overhaul_hours, effective_date, ...)
   ├─ UPDATE products SET current_overhaul_hours = {new_hours}
   │
   └─ History appears in list (newest first)
      └─ Chart automatically updates to show new data point

Step 6: DELETE PRODUCT (Optional)
   ├─ User: Click "Delete" on product row
   ├─ Confirm: "Are you sure?"
   └─ DELETE FROM products WHERE id = product_id
      └─ Cascade: Overhaul history records deleted too

Step 7: VIEW CAPACITY IMPACT (Optional)
   ├─ Products may be used in ME Capacity planning
   ├─ Capacity planners see: Current overhaul hours per product
   ├─ Query: productsDataGetCurrentOverhaulTime(productId)
   │  └─ Returns: Latest hours from products.current_overhaul_hours
   │
   └─ Historical hours: productsDataGetOverhaulTimeOnDate(productId, date)
      └─ Looks up: Most recent history entry on/before that date

Step 8: PRODUCT STATUS (Current Values)
   ├─ Currently stored but not actively used in workflow
   ├─ Values: 'active' (default), or custom (user can type)
   └─ Display: Shown as badge in product list
      └─ Example: 🟢 Active, 🟡 In Review, 🔴 Discontinued
```

---

## 📊 Database State During Lifecycle

### Initial State (After Product Created)

```javascript
// In products table
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "HVAC Cooling Unit Pro",
  part_number: "HVAC-CU-PRO-2024",
  family: "hvac",
  customer: "Acme Corp",
  location: "Unit 2",
  current_overhaul_hours: 120.5,
  turnaround_days: 14,
  status: "active",
  notes: "Custom cooling system for facility",
  created_at: "2024-03-01T10:00:00Z",
  updated_at: "2024-03-01T10:00:00Z",
  user_id: "..."
}

// In overhaul_history table (empty initially)
[]
```

### After First Overhaul History Entry

```javascript
// products table (updated)
{
  ...same as above...
  current_overhaul_hours: 130.0,  // ← Updated to latest
  updated_at: "2024-03-14T15:30:00Z"
}

// overhaul_history table (new entry)
[
  {
    id: "...",
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    overhaul_hours: 130.0,
    effective_date: "2024-03-14",
    change_reason: "Customer requirement update",
    notes: "Increased cooling capacity needed",
    created_by_name: "user@company.com",
    created_at: "2024-03-14T15:30:00Z"
  }
]
```

### After Second Overhaul History Entry

```javascript
// products table (updated again)
{
  ...same...
  current_overhaul_hours: 125.0,  // ← Updated to latest
  updated_at: "2024-03-20T09:15:00Z"
}

// overhaul_history table (chronological, newest first)
[
  {
    id: "...",
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    overhaul_hours: 125.0,
    effective_date: "2024-03-20",
    change_reason: "Design optimization",
    notes: "Simplified cooling loop",
    created_by_name: "user@company.com",
    created_at: "2024-03-20T09:15:00Z"
  },
  {
    id: "...",
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    overhaul_hours: 130.0,
    effective_date: "2024-03-14",
    change_reason: "Customer requirement update",
    notes: "Increased cooling capacity needed",
    created_by_name: "user@company.com",
    created_at: "2024-03-14T15:30:00Z"
  }
]
```

---

## 🔌 Integration Points (Current)

### Product → Capacity Planning (ME)

```
Capacity Dashboard
    ├─ Shows: "Products in Queue" or "Active Products"
    ├─ Uses: productsDataGetCurrentOverhaulTime(productId)
    │  └─ Returns: products.current_overhaul_hours
    │
    ├─ Planning: Capacity planners estimate ME load based on product hours
    ├─ Forecasting: Days to complete = hours ÷ team hours/week
    │
    └─ Timeline: Product flows through capacity plan (no project yet)
       └─ Status: Just tracked in products table
```

### Product → Product Development (Families)

```
Product Development Portal
    ├─ Family View: Lists all families and product count per family
    │  └─ Uses: Filter products by family
    │
    ├─ Family Templates (Future): PFMEA templates per family
    │  └─ When NPI project created, inherits family templates
    │
    └─ NPI Portal (Separate): New Product Introduction workflow
       └─ Currently: Manual project creation (no product link)
          └─ STATUS: User selects "New Project" and fills in details manually
             (product data NOT auto-filled)
```

### Product → Production Planning (Gantt)

```
Production Portal
    ├─ Scheduling: User creates production batches manually
    │  └─ May reference product, but no automatic linkage
    │
    ├─ Gantt Chart: Shows production timeline
    │  └─ Data: Manually entered milestones, no auto-sync from products
    │
    └─ Work Areas: Units/facilities where production happens
       └─ Products assigned to work area: "Unit 2", "Unit 3", etc.
          └─ Uses: products.work_location field
```

---

## 🔄 Real-Time Sync (Current)

### Subscription Flow

```
User A: Opens Product Management Portal
    ├─ productsDataInit()
    │  ├─ SELECT * FROM products
    │  ├─ SELECT * FROM overhaul_history
    │  └─ createRealtimeSubscription('products', 'products_channel', {...})
    │
    └─ Subscribed to: products and overhaul_history changes

User B: Creates new product in different browser tab
    ├─ INSERT INTO products (...)
    ├─ Supabase broadcasts: REALTIME INSERT event
    │
    └─ User A's subscription triggers:
       onInsert: (newProduct) => {
         productsDataUpsertProduct(newProduct);
         renderProductsList();
       }
       └─ New product appears in User A's list (no refresh needed!)

User B: Adds overhaul history entry
    ├─ INSERT INTO overhaul_history (...)
    ├─ Supabase broadcasts: REALTIME INSERT event
    │
    └─ User A's subscription triggers:
       onInsert: (historyRecord) => {
         productsState.history[productId].push(historyRecord);
         refreshTrendsChart();
       }
       └─ Chart updates with new data point (real-time)
```

---

## 🎨 UI Components (Current)

### Product List View

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🔍 Search: _______________           [+ Add Product] [Trends] [Families]│
├──────────────────────────────────────────────────────────────────────┤
│ Name    │Part #  │Family │Location │Customer │Hours │Days │Status │Edit│
├─────────┼────────┼───────┼─────────┼─────────┼───────┼─────┼───────┼────┤
│HVAC...  │HC-2024 │HVAC   │Unit 2   │Acme     │ 120.5 │ 14  │active │✎ 🗑│
│Rotary...*│RO-2025 │Rot    │Unit 3   │Beta Inc │ 85.0  │  8  │active │✎ 🗑│
│Pneuma...|PN-2024 │Pneu   │Unit 2   │Delta    │ 45.0  │  5  │active │✎ 🗑│
└─────────┴────────┴───────┴─────────┴─────────┴───────┴─────┴───────┴────┘

Inline Edit Mode (Click row "✎"):
┌──────────────────────────────────────────────────────────────────────┐
│ Name    │Part #      │Family  │Location│Customer │Hours  │Days │✓ ✕│
├─────────┼────────────┼────────┼────────┼─────────┼────────┼─────┼───┤
│[input]  │[input]     │[select]│[input] │[input]  │[input] │[inp]│✓ ✕│
└─────────┴────────────┴────────┴────────┴─────────┴────────┴─────┴───┘
```

### Trends Tab (Chart)

```
Overhaul Hours Trends — HVAC Cooling Unit Pro
┌────────────────────────────────────────────┐
│ 140 │                                       │
│ 130 │    ●─────●                           │
│ 120 │   ╱       ╲                          │
│ 110 │  ╱         ●─────●                   │
│ 100 │ ╱                                     │
│  90 │                                       │
│     └─────────────────────────────────────── │
│      2024-03  2024-06  2024-09  2024-12     │
└────────────────────────────────────────────┘

Data Points (from overhaul_history):
- 2024-03-14: 120.5 hours
- 2024-03-20: 125.0 hours (error, was wrong)
- 2024-04-01: 110.0 hours (optimization)
- 2024-06-15: 115.0 hours (customer change)
```

### Families Tab

```
Product Families
┌───────────────────────────────────────┐
│ Family           │ Products │ Templates │
├──────────────────┼──────────┼───────────┤
│ 🔵 HVAC          │    12    │   Yes     │
│ 🟢 Rotating      │     8    │   Yes     │
│ 🟡 Pneumatic     │     5    │   No      │
│ ⚫ Other         │     3    │   No      │
└───────────────────────────────────────┘

Clicking family → Shows family detail + PFMEA templates (if exists)
```

---

## 📁 Current File Organization

```
portals/product-development/product-management/
├── js/
│   ├── products-data.js
│   │   ├── productsState {products[], history{}, loaded}
│   │   ├── productsDataInit() ← Load all products + history
│   │   ├── productsDataAddProduct()
│   │   ├── productsDataUpdateProduct()
│   │   ├── productsDataDeleteProduct()
│   │   ├── productsDataAddHistory()
│   │   ├── productsDataDeleteHistory()
│   │   ├── productsDataGetCurrentOverhaulTime()
│   │   ├── productsDataGetOverhaulTimeOnDate()
│   │   └── productsDataInitRealtime()
│   │
│   ├── products.js
│   │   ├── renderProductsList()
│   │   ├── productsStartEdit()
│   │   ├── productsSaveEdit()
│   │   ├── productsDeleteProduct()
│   │   ├── showAddProductForm()
│   │   └── Event handlers
│   │
│   └── trends-chart.js
│       ├── renderTrendsChart(productId)
│       └── Chart.js v4.4.0 integration
│
├── css/
│   └── products.css
│       ├── Table styling
│       ├── Inline edit styling
│       ├── Badge colors (status)
│       └── Mobile-first responsive design
│
└── index.html (links via <script> tags)
```

---

## 🔄 State Variables (Current)

```javascript
// In core/js/state.js
let currentSection = 'product-development';  // Portal context
let productDevelopmentTab = 'product-management';  // Sub-tab

// In portals/product-development/product-management/products-data.js
let productsState = {
  products: [],      // All products from database
  history: {},       // product_id -> [history records]
  loaded: false      // Has init() completed?
};

let productsRealtimeActive = false;  // Subscription active?

// In products.js (UI state)
let productsEditingId = null;        // Which product being edited?
let productsActiveTab = 'list';      // 'list' | 'trends' | 'families'
```

---

## 🚀 Common User Workflows (Current)

### Workflow 1: Track Overhaul Hours Over Time

```
1. Create product with initial hours estimate
   └─ Product created with current_overhaul_hours = 120.5

2. Over weeks/months, customer provides updates
   ├─ Week 1: Add history entry: 130.0 hours (customer change)
   ├─ Week 2: Add history entry: 125.0 hours (design optimization)
   ├─ Week 3: Add history entry: 128.0 hours (final confirmation)
   │
   └─ products.current_overhaul_hours = 128.0 (latest)

3. View trends chart
   └─ Chart shows: 120.5 → 130.0 → 125.0 → 128.0 (visual trend)

4. Use current hours in capacity planning
   └─ ME Capacity planner: "This product takes 128 hours"
```

### Workflow 2: Manage Multiple Products Per Family

```
1. Create 3 HVAC products:
   ├─ HVAC Cooling Unit Pro
   ├─ HVAC Heating Unit Pro
   └─ HVAC Controller Unit

2. View Families tab
   └─ Shows: "HVAC - 3 products" (count)

3. (Future) When family PFMEA templates created:
   └─ NPI projects for HVAC products auto-inherit templates

4. (Future) Track progress across all family products:
   └─ Dashboard: "3 HVAC products, 2 in NPI, 1 in Production"
```

### Workflow 3: Search & Filter

```
1. User searches: "hvac"
   └─ Products filtered: Shows 3 HVAC products (real-time)

2. User searches: "Unit 2"
   └─ Products filtered: Shows products in Unit 2 location

3. User searches: "Acme"
   └─ Products filtered: Shows Acme Corp products
```

---

## ❌ Current Limitations (No Tendering)

| Limitation | Impact | Solution (Tendering) |
|-----------|--------|----------------------|
| No automatic NPI project creation from product | Manual effort to create projects | Product "Tender" status triggers project creation |
| Product and NPI project separate systems | No linkage, manual data entry | Implicit/explicit product ↔ project link |
| No gate customization per product type | All projects use all gate questions | Gate selections per project based on product/family |
| Can't track product journey through gates | No visibility into APQP progress | Gate status in product detail view |
| Product status not enforced/used | Status is just metadata | Status drives workflow (Tender → NPI → Prod → Closed) |
| No family-level gate templates | Can't reuse gate questions | Family PFMEA templates created pre-project |

---

## 🔮 Future State (With Tendering)

After tendering feature implemented:

```
PRODUCT LIFECYCLE (Enhanced)

Create Product
    ↓
Manage Overhaul Hours (Same as today)
    ↓
Set Status to "TENDER" ← NEW TRIGGER
    ↓
NPI Project Created Automatically ← NEW
    ├─ Pre-filled: name, customer, family
    └─ Gate questions selected per family ← NEW
    ↓
APQP Workflow (gates, CTQ, PFMEA, CP, BOM)
    ├─ Gate customization visible in product ← NEW
    └─ Real-time progress in product detail ← NEW
    ↓
Product Status → "NPI"
    ↓
Gates Signed Off
    ↓
Product Status → "PRODUCTION"
    ↓
Ongoing Overhaul Hour Tracking (Same as today)
    ↓
Product Status → "CLOSED"
```

---

## 📚 Related Documentation

- **PRODUCT_MANAGEMENT_GUIDE.md** — Detailed system reference
- **NPI_PROJECT_FLOW_GUIDE.md** — NPI project workflow
- **NPI_TENDERING_FEATURE_PLAN.md** — Implementation plan (Phase 0 adds trigger)
- **GATE_DEFINITIONS_GUIDE.md** — Gate structure

---

## 🤔 FAQ: Current System

**Q: Why track both `products.current_overhaul_hours` and `overhaul_history` table?**
A: `current_overhaul_hours` is the "current state" (fast query). History table maintains audit trail (why did it change?). Dual storage enables both fast queries and historical analysis.

**Q: Why is `status` field in products if it's not used?**
A: Prepared for future workflow integration. Currently it's just a label. Tendering feature will activate it as a workflow driver.

**Q: How do products relate to NPI projects today?**
A: No automatic relationship. Users create products, then separately create NPI projects. Projects happen to use same product name, but no database link. (Fixed by tendering feature: explicit link via product_id)

**Q: Can two products have same name?**
A: Yes (not prevented). Not recommended. Tendering feature assumes 1:1 product:project naming.

**Q: What happens to products when NPI project is created?**
A: Nothing. They're separate entities. Product overhaul hours might inform project timeline, but no automatic updates. (Tendering feature creates link)

---

**Last Updated:** 2026-03-14
**Status:** Describes current system before tendering feature
**Next Steps:** See NPI_TENDERING_FEATURE_PLAN.md Phase 0 for how this changes
