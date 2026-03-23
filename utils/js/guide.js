// ═══════════════════════════════════
// guide.js — User Guide modal system
// Provides showGuide(key) to open context-sensitive help modals
// ═══════════════════════════════════

const GUIDE_CONTENT = {

  // ── Hub ──────────────────────────────────────────────────────
  hub: {
    title: '🏠 Tidyco Operations Portal — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Operations Portal</strong> is the central hub for all Tidyco quality planning, capacity management, and production operations. Select any of the five modules to get started.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📊 Capacity</div>
        <p>Plan and monitor workload across five departments: Manufacturing Engineering (ME), Project Management (PM), Production, Logistics, and Unit 6. Tracks team capacity against live task data.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🚀 Product Development</div>
        <p>Manage NPI (New Product Introduction) projects through APQP gates, PFMEA, Bill of Materials, and quality planning. Includes product catalogue and parts database.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🏭 Production</div>
        <p>Schedule production batches and view loading by product or work area. Links directly to capacity data.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🛰️ Operations Dashboard</div>
        <p>Director-level overview drawing live data from all portals — capacity utilisation, overdue actions, high-risk items, and production flow in one place.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🔧 Manufacturing Change</div>
        <p>Raise and track Engineering Change Requests (ECRs). Changes go through a two-step approval workflow. Approved changes are logged in the activity timeline and can be linked to PFMEA corrective actions.</p>
      </div>
    `
  },

  // ── Capacity Hub ─────────────────────────────────────────────
  capacity: {
    title: '📊 Capacity Management — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Capacity Management</strong> portal lets you plan and monitor workload across five operational streams. Select a stream to view its loading plan.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🚂 Production Capacity</div>
        <p>Schedule-driven capacity plan. Pulls batch data from the Production portal and maps it against work area throughput rates to show loading by week and month.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🧑‍🔧 Manufacturing Engineering (ME)</div>
        <p>Man-hours planning for the ME team. Enter team members, assign tasks and project work, then view the chart to see how loaded each person is month-by-month.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📅 Project Management (PM)</div>
        <p>Same structure as ME Capacity but filtered to the PM department. Shares the same underlying data table, separated by department tag.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🚚 Logistics</div>
        <p>Same structure as ME Capacity but for the Logistics department. Tracks kitting and product movement workload alongside team tasks and product support hours.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🏭 Unit 6</div>
        <p>Same structure as ME Capacity but for the Unit 6 department. Tracks team loading, tasks, and product support for that work area.</p>
      </div>
    `
  },

  // ── ME Capacity ───────────────────────────────────────────────
  'capacity-me': {
    title: '🧑‍🔧 ME Load Capacity — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>ME Capacity</strong> plan tracks Manufacturing Engineering workload against available hours. Data is shared in real time across all logged-in users. The Logistics and Unit 6 departments use the same tab structure — their data is stored in the same underlying tables, separated by department tag.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📊 Capacity Chart</div>
        <p>Bar chart showing total allocated hours vs available capacity per month. Use the month navigator to scroll the view window. Bars turn amber when utilisation exceeds 80%, red above 100%.</p>
        <p><strong>Calculation:</strong> Available hours = (working days in month × hours per day) × number of team members, minus approved holidays.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">👷 Team</div>
        <p>Add and manage ME team members. Set each person's hours per day (e.g. 7.5h) and department tag. Team members appear as rows in the capacity calculations.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📋 Tasks</div>
        <p>Log ongoing tasks and projects. Each task has an estimated duration (using 3-point PERT estimation: optimistic, most likely, pessimistic). Tasks are assigned to a month range and contribute to the capacity chart.</p>
        <p><strong>PERT formula:</strong> Expected duration = (Optimistic + 4 × Most Likely + Pessimistic) ÷ 6</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🚂 Product Support</div>
        <p>Assign ME effort to specific products in the production plan. This represents recurring support time (e.g. inspection, rework support) separate from project tasks.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📦 Product Load</div>
        <p>View the total ME hours attributed to each product, broken down by task and support entries.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🏖️ Holiday Planner</div>
        <p>Record approved annual leave for each team member by month. Holidays reduce available capacity on the chart. UK bank holidays are automatically deducted.</p>
      </div>
    `
  },

  // ── Production Capacity ───────────────────────────────────────
  'capacity-production': {
    title: '🚂 Production Load Capacity — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Production Capacity</strong> plan maps scheduled production batches against work area throughput to show whether the shop floor is over or under loaded.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Data Sources</div>
        <p>Pulls live data from: <strong>Production → Scheduling</strong> (batch start/end dates and quantities) and <strong>Work Area settings</strong> (throughput rate per unit per week).</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📈 Dashboard</div>
        <p>Overall loading chart across all work areas. Shows total scheduled units per week vs combined capacity. Highlights over-capacity periods in red.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🏭 By Work Area</div>
        <p>Drill down into loading for each individual work area (e.g. Unit 2, Unit 3). Shows a bar chart of scheduled units vs available throughput per week.</p>
        <p><strong>Calculation:</strong> Utilisation % = scheduled units ÷ (throughput rate × working weeks in period) × 100</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">⚙️ Capacity Settings</div>
        <p>Configure work areas and their throughput rates. Add new work areas here — they will appear in both the capacity plan and production scheduling.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📋 Batch Detail</div>
        <p>Table view of all scheduled batches with their assigned work area, quantities, and date ranges. Useful for reviewing the full production schedule at a glance.</p>
      </div>
    `
  },

  // ── PM Capacity ───────────────────────────────────────────────
  'capacity-pm': {
    title: '📅 Project Management Capacity — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>PM Capacity</strong> plan tracks Project Manager workload against available hours. It uses the same data structure as ME Capacity, filtered to the PM department tag.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Data Sources</div>
        <p>Shares the same underlying dataset as ME Capacity (teams, tasks, products, holidays) but only displays records tagged as <strong>PM</strong> department.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📊 Capacity Chart</div>
        <p>Month-by-month bar chart of PM team loading vs available hours. Use the month navigator to scroll forward or back.</p>
        <p><strong>Calculation:</strong> Available hours = (working days × hours per day per PM) minus approved holidays and UK bank holidays.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">👷 Team / 📋 Tasks / 📦 Product Load / 🏖️ Holiday Planner</div>
        <p>Same as ME Capacity — see ME guide for details. All entries made here are tagged PM so they don't appear in the ME view.</p>
      </div>
    `
  },

  // ── Product Development Hub ───────────────────────────────────
  'product-development': {
    title: '🚀 Product Development — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Product Development</strong> portal covers the full lifecycle of a product from initial tender through to production sign-off.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📋 NPI Projects</div>
        <p>View and manage all NPI (New Product Introduction) projects. Each project follows the APQP gate process from Gate 0 (Tender) to Gate 5 (Production Approval). Click a project to open its dashboard.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📦 Product Management</div>
        <p>Central product catalogue listing all products with their current lifecycle status (Tender → NPI → Production → Closed). Tracks overhaul history and trends.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🏢 Product Family Database</div>
        <p>Define product families (e.g. HVAC, Rotating Machines). Families group products and can hold reusable PFMEA templates that auto-populate new NPI projects.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🔩 Parts Database</div>
        <p>Central catalogue of A, B and C-class parts. Parts added here can be linked to BOM entries across all NPI projects. ABC classification drives inventory prioritisation.</p>
      </div>
    `
  },

  // ── NPI Projects List ─────────────────────────────────────────
  'npi-projects': {
    title: '📋 NPI Projects — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>NPI Projects</strong> view shows all products organised by their current APQP status. Each card is an NPI project linked to a product record.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Status Lanes</div>
        <p>Projects are grouped into lanes: <strong>Tender</strong> (Gate 0 scope agreed), <strong>NPI</strong> (active APQP), <strong>Production</strong> (Gate 5 signed off), and <strong>Closed</strong> (archived). Status is set in Product Management.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Data Sources</div>
        <p>Project cards pull data from: Product Management (name, status, customer), Gates (current gate number), Actions (overdue count), and PFMEA (high-RPN count).</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Filtering & Search</div>
        <p>Use the search bar to filter by product name. Use the Family and Status dropdowns to narrow results. Switch between <em>Active</em>, <em>All</em>, and <em>Completed</em> view modes using the toggle buttons.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Creating Projects</div>
        <p>Projects are automatically created when a product is added in Product Management. To create a new project, add a product there first.</p>
      </div>
    `
  },

  // ── NPI Project Dashboard ─────────────────────────────────────
  'npi-dashboard': {
    title: '🏠 NPI Project Dashboard — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Project Dashboard</strong> is the central KPI summary for a single NPI project. All metrics update in real time as data is entered in other tabs.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Gate Strip</div>
        <p>Shows all 6 APQP gates (G0–G5) with completion percentage. Green = fully signed off. Amber = in progress. Grey = not started. Click any gate to open it.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Alert Banner</div>
        <p>Highlights any: overdue actions, high-severity open risks (score ≥ 12), and PFMEA causes with RPN ≥ 100. These link directly to the relevant tab.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Data Sources</div>
        <ul class="guide-list">
          <li><strong>Gates</strong> — completion % from checklist items and sign-off status</li>
          <li><strong>Actions</strong> — open and overdue counts from the Action Tracker</li>
          <li><strong>Risks</strong> — open and high-severity counts from the Risk Register</li>
          <li><strong>PFMEA</strong> — high-RPN cause count (RPN = SEV × OCC × DET)</li>
          <li><strong>BOM</strong> — total item count and AAW-flagged items</li>
          <li><strong>Timing</strong> — total rows and rows with activity</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Sub-assemblies</div>
        <p>If this project has linked sub-assembly projects, their summary cards appear below the main KPIs. Click to navigate to that sub-project.</p>
      </div>
    `
  },

  // ── APQP ─────────────────────────────────────────────────────
  'npi-apqp': {
    title: '📐 APQP — User Guide',
    body: `
      <div class="guide-section">
        <p><strong>APQP</strong> (Advanced Product Quality Planning) is the structured quality planning process. The four tabs form a connected chain — output from one feeds into the next.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🎯 CTQ Matrix (Step 1)</div>
        <p>Define Critical-to-Quality requirements from customer specs, drawings, and standards. These become the quality targets that the entire process must meet.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🔄 Process Flow Diagram — PFD (Step 2)</div>
        <p>Map the manufacturing process as numbered steps. Link CTQ requirements to each step. Steps become the backbone for PFMEA and Control Plan.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">⚠️ PFMEA (Step 3)</div>
        <p>Analyse potential failure modes for each PFD step. The output (RPN scores and actions) drives the Control Plan.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📋 Control Plan (Step 4)</div>
        <p>Production-phase controls linked to PFMEA causes. Use <em>Sync from PFMEA</em> to auto-populate. Each row specifies how a potential failure is detected and controlled in production.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Flow of Data</div>
        <p>CTQ → PFD (linked to steps) → PFMEA (linked to PFD steps) → Control Plan (synced from PFMEA causes)</p>
      </div>
    `
  },

  // ── CTQ ──────────────────────────────────────────────────────
  'npi-ctq': {
    title: '🎯 CTQ Matrix — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>CTQ Matrix</strong> (Critical to Quality) captures all quality requirements the product must meet. It is the foundation of the APQP process.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Columns Explained</div>
        <ul class="guide-list">
          <li><strong>Ref</strong> — Auto-numbered reference (C1, C2, etc.)</li>
          <li><strong>Requirement</strong> — The quality characteristic or parameter</li>
          <li><strong>Target / Tolerance</strong> — Measurement spec (e.g. 50±0.05mm)</li>
          <li><strong>Test Method</strong> — How it is measured (e.g. CMM, Gauge, Visual)</li>
          <li><strong>Source</strong> — Where the requirement comes from (Customer Spec, Drawing, etc.)</li>
          <li><strong>Out-of-Spec Action</strong> — What to do if the part fails (Repair, Replace, Scrap, etc.)</li>
          <li><strong>Customer Accepted</strong> — Tick when the customer has approved the test method and OOS plan</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Used By</div>
        <p>CTQ references (C1, C2, …) can be linked to PFD steps via the <em>＋ CTQ</em> button in the Process Flow. This traceability carries through to the Control Plan.</p>
      </div>
    `
  },

  // ── PFD ──────────────────────────────────────────────────────
  'npi-pfd': {
    title: '🔄 Process Flow Diagram — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Process Flow Diagram (PFD)</strong> maps each manufacturing step in sequence. Steps are numbered in 10s so new steps can be inserted between existing ones without renumbering.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Step Structure</div>
        <ul class="guide-list">
          <li><strong>Step Number</strong> — Permanent reference used in PFMEA and Control Plan. Not changed when steps are reordered.</li>
          <li><strong>Operation</strong> — The process step name (e.g. "Bearing Press Fit")</li>
          <li><strong>Detail / Notes</strong> — Method description or key notes</li>
          <li><strong>CTQ Links</strong> — Attach CTQ requirements relevant to this step via <em>＋ CTQ</em></li>
          <li><strong>Resources</strong> — Link BOM items (parts, tools, equipment) to this step via <em>＋ Resource</em></li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Section Headers</div>
        <p>Click <em>＋ section after</em> (visible below each step) to insert a collapsible section header. Sections group steps under a named heading — click the toggle arrow to collapse or expand the group. Useful for organising complex processes into phases (e.g. STRIP DOWN UNIT, INSPECTION, REASSEMBLY).</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Flowchart View</div>
        <p>Click <em>Show Flowchart</em> to switch from the table to a visual flow diagram. Each step appears as a node; Decision and Inspection steps show Yes/Pass and No/Fail branches. Step types are: <strong>Process</strong>, <strong>Decision</strong>, <strong>Inspection</strong>, <strong>Rework</strong>, and <strong>Transport</strong>. Steps with a high PFMEA RPN are marked ⚑. Click any node to see its details. Use <em>↔ Horizontal / ↕ Vertical</em> to change the layout direction.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Section Navigator</div>
        <p>The ribbon at the top shows each section with its step range. Click a section to scroll the table to that group.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Inserting Steps</div>
        <p>Click the <em>＋</em> button next to any step to insert a new step immediately after it. The system assigns the next available step number in the gap.</p>
      </div>
    `
  },

  // ── PFMEA ────────────────────────────────────────────────────
  'npi-pfmea': {
    title: '⚠️ PFMEA — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>PFMEA</strong> (Process Failure Mode and Effects Analysis) systematically identifies how the manufacturing process could fail and quantifies the risk so that preventive actions can be prioritised.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Three-Level Structure</div>
        <ul class="guide-list">
          <li><strong>Failure Mode</strong> — How could this process step fail? (linked to a PFD step)</li>
          <li><strong>Effect</strong> — What is the consequence of this failure? Rated by <strong>SEV</strong> (Severity, 1–10)</li>
          <li><strong>Cause</strong> — What causes the failure mode? Rated by <strong>OCC</strong> (Occurrence, 1–10) and <strong>DET</strong> (Detectability, 1–10)</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">RPN Calculation</div>
        <p><strong>RPN = SEV × OCC × DET</strong></p>
        <p>RPN ranges from 1 to 1,000. Items with <strong>RPN ≥ 100</strong> are flagged in amber/red and appear as alerts on the project dashboard.</p>
        <p>After adding a corrective action, enter the <em>new</em> OCC and DET values to calculate a <strong>Forecast RPN</strong> = SEV × New OCC × New DET.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Rating Scales</div>
        <ul class="guide-list">
          <li><strong>SEV 10</strong> — Safety / regulatory impact. <strong>SEV 1</strong> — No discernible effect.</li>
          <li><strong>OCC 10</strong> — Near certain to occur. <strong>OCC 1</strong> — Very unlikely.</li>
          <li><strong>DET 10</strong> — Cannot be detected. <strong>DET 1</strong> — Near certain detection before reaching customer.</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Special Characteristics (SC)</div>
        <p>Each <strong>Effect</strong> can be flagged with a Special Characteristic to indicate it requires enhanced controls beyond standard process monitoring.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:13px">
          <tr style="border-bottom:1px solid var(--line)">
            <td style="padding:6px 10px 6px 0;font-size:18px;white-space:nowrap">🦺 Safety</td>
            <td style="padding:6px 0;color:var(--mid)">Failure could injure an operator, end-user, or violate a regulatory requirement. These must have documented prevention and detection controls.</td>
          </tr>
          <tr style="border-bottom:1px solid var(--line)">
            <td style="padding:6px 10px 6px 0;font-size:18px;white-space:nowrap">❗ Critical</td>
            <td style="padding:6px 0;color:var(--mid)">Non-conformance is very likely to reach the customer without detection. Requires robust 100% inspection or process control.</td>
          </tr>
          <tr>
            <td style="padding:6px 10px 6px 0;font-size:18px;white-space:nowrap">⚠️ Major</td>
            <td style="padding:6px 0;color:var(--mid)">Significant impact on product quality or function. Needs formal monitoring but may not require 100% inspection.</td>
          </tr>
        </table>
        <p style="margin-top:8px">Use the <strong>SC filter</strong> in the toolbar to view only steps with a particular characteristic.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Used By</div>
        <p>PFMEA causes can be synced directly into the <strong>Control Plan</strong> using the <em>Sync from PFMEA</em> button. High-RPN causes are surfaced in the <strong>Project Dashboard</strong> and <strong>Operations Risk</strong> view. If a corrective action is linked to a Manufacturing Change request, a badge appears on that action row — click it to open the related entry in the Change Register (MCS).</p>
      </div>
    `
  },

  // ── Control Plan ─────────────────────────────────────────────
  'npi-cp': {
    title: '📋 Control Plan — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Control Plan</strong> documents the production controls that will prevent PFMEA failure causes from reaching the customer. It is the final step of the APQP chain.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Sync from PFMEA</div>
        <p>Click <em>Sync from PFMEA</em> to automatically add a row for every PFMEA cause not already in the plan. Existing rows are not overwritten. Run this after completing or updating the PFMEA.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Columns Explained</div>
        <ul class="guide-list">
          <li><strong>PFD Step</strong> — Linked from the Process Flow (auto-populated on sync)</li>
          <li><strong>Failure Mode / Cause</strong> — Carried from PFMEA (auto-populated on sync)</li>
          <li><strong>SEV / OCC / DET</strong> — Carried from PFMEA for reference</li>
          <li><strong>Control Method</strong> — What check or process control prevents or detects the cause</li>
          <li><strong>Frequency</strong> — How often the control is applied</li>
          <li><strong>Reaction Plan</strong> — What to do if the control detects a failure</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Data Sources</div>
        <p>Pulls PFD step numbers from the <strong>Process Flow</strong> and failure modes/causes from the <strong>PFMEA</strong>. CTQ links are also carried through for traceability.</p>
      </div>
    `
  },

  // ── Action Tracker ────────────────────────────────────────────
  'npi-actions': {
    title: '✅ Action Tracker — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Action Tracker</strong> is the central log of all outstanding tasks for this NPI project. All fields are editable inline — just click and type.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Columns Explained</div>
        <ul class="guide-list">
          <li><strong>Description</strong> — What needs to be done</li>
          <li><strong>Owner</strong> — Who is responsible</li>
          <li><strong>Due Date</strong> — Target completion date (overdue items turn red)</li>
          <li><strong>Status</strong> — Open / In Progress / Closed / Blocked</li>
          <li><strong>Priority</strong> — High / Medium / Low</li>
          <li><strong>Source</strong> — Where the action came from (Gate, PFMEA, Risk, General)</li>
          <li><strong>Notes</strong> — Any additional context</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Overdue Highlighting</div>
        <p>Actions whose due date has passed and status is not Closed are highlighted in red. The count of overdue actions appears on the <strong>Project Dashboard</strong> and <strong>Operations Dashboard</strong>.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Used By</div>
        <p>Overdue action counts are pulled by: <strong>Project Dashboard</strong> (alert banner), <strong>Operations Dashboard</strong> (Delivery Confidence metric and Actions tab).</p>
      </div>
    `
  },

  // ── Risk Register ─────────────────────────────────────────────
  'npi-risks': {
    title: '🛡 Risk Register — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Risk Register</strong> captures project-level risks (commercial, technical, supply chain, etc.) and scores them to prioritise mitigation effort.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Risk Score Calculation</div>
        <p><strong>Score = Likelihood × Impact</strong> (both rated 1–5)</p>
        <ul class="guide-list">
          <li>Score <strong>≥ 12</strong> — High risk (red)</li>
          <li>Score <strong>6–11</strong> — Medium risk (amber)</li>
          <li>Score <strong>&lt; 6</strong> — Low risk (green)</li>
        </ul>
        <p>Click <em>📊 Risk Matrix</em> to view a 5×5 grid showing the score zones at a glance.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Columns Explained</div>
        <ul class="guide-list">
          <li><strong>Risk Description</strong> — What could go wrong</li>
          <li><strong>Category</strong> — Technical / Supply Chain / Schedule / Resource / Customer / Commercial</li>
          <li><strong>Owner</strong> — Who is managing the risk</li>
          <li><strong>L</strong> — Likelihood (1 = very unlikely, 5 = near certain)</li>
          <li><strong>I</strong> — Impact (1 = negligible, 5 = catastrophic)</li>
          <li><strong>Score</strong> — L × I</li>
          <li><strong>Mitigation</strong> — Actions being taken to reduce the risk</li>
          <li><strong>Status</strong> — Open / Mitigated / Closed</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Used By</div>
        <p>High-risk counts are surfaced on the <strong>Project Dashboard</strong> (alert banner) and <strong>Operations Risk</strong> view.</p>
      </div>
    `
  },

  // ── BOM ───────────────────────────────────────────────────────
  'npi-bom': {
    title: '📦 Bill of Materials — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Bill of Materials (BOM)</strong> records all items needed to manufacture and support the product. Items are split into categories and can be linked to process steps in the PFD.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">BOM Categories</div>
        <ul class="guide-list">
          <li><strong>Parts</strong> — Components and sub-assemblies (part numbers)</li>
          <li><strong>Tools</strong> — Special tooling and fixtures</li>
          <li><strong>Equipment</strong> — Machinery and test equipment</li>
          <li><strong>Materials</strong> — Raw materials and consumables used in process</li>
          <li><strong>Consumables</strong> — PPE, chemicals, adhesives, etc.</li>
          <li><strong>Kits</strong> — Named groups of items from any category (e.g. "Overhaul Kit")</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">ABC Classification</div>
        <p>Parts are classified A, B, or C based on value:</p>
        <ul class="guide-list">
          <li><strong>A</strong> — High value / critical (top 10–20% by value). Tightest inventory control.</li>
          <li><strong>B</strong> — Medium value (middle tier ~30%). Standard control.</li>
          <li><strong>C</strong> — Low value / common (50–70% of unique parts, ~5–10% of total value). Minimal control.</li>
        </ul>
        <p>Items marked <strong>AAW</strong> (Additional Arising Work) have special stocking requirements.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Linking to PFD</div>
        <p>In the Process Flow, click <em>＋ Resource</em> on any step to attach BOM items. This creates traceability from process step to required materials and tooling.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Parts Database</div>
        <p>Parts can be added from the central <strong>Parts Database</strong> (Product Development → Parts Database) using the <em>＋ Add from Parts Database</em> button.</p>
      </div>
    `
  },

  // ── Timing Plan ───────────────────────────────────────────────
  'npi-timing': {
    title: '📅 NPI Timing Plan — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>NPI Timing Plan</strong> is a Gantt-style chart showing planned and actual activity for each task row across weeks and months.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">How to Use</div>
        <ul class="guide-list">
          <li>Click <em>＋ Add Task</em> to add a new row. Enter the task name and any notes.</li>
          <li>Click individual week cells to toggle <strong>Planned</strong> (green) activity.</li>
          <li>Use the <em>Actual</em> toggle (per row) to mark weeks where work actually occurred (hatched orange pattern).</li>
          <li>Click a month header to <strong>collapse</strong> that month to a narrow column, saving horizontal space.</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Colour Legend</div>
        <ul class="guide-list">
          <li><span style="display:inline-block;width:14px;height:10px;border-radius:2px;background:var(--green);margin-right:6px;vertical-align:middle"></span><strong>Green</strong> — Planned weeks</li>
          <li><span style="display:inline-block;width:14px;height:10px;border-radius:2px;background:var(--amber);margin-right:6px;vertical-align:middle"></span><strong>Orange hatched</strong> — Actual weeks</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Sub-assembly rows</div>
        <p>Tasks can be assigned to a sub-assembly grouping. Use the task group dropdown when adding a task to keep related items together.</p>
      </div>
    `
  },

  // ── Gates ────────────────────────────────────────────────────
  'npi-gates': {
    title: '🚪 APQP Gates — User Guide',
    body: `
      <div class="guide-section">
        <p><strong>APQP Gates</strong> (G0–G5) are formal review checkpoints where a cross-functional team signs off that the project is ready to proceed to the next phase.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">The Six Gates</div>
        <ul class="guide-list">
          <li><strong>Gate 0 — Tender</strong>: Scope confirmed, commercial feasibility assessed</li>
          <li><strong>Gate 1 — Concept</strong>: Design concept approved, resources committed</li>
          <li><strong>Gate 2 — Design</strong>: Detailed design complete, PFMEA and CTQ defined</li>
          <li><strong>Gate 3 — Prototype</strong>: Build and test approved, BOM finalised</li>
          <li><strong>Gate 4 — Pilot</strong>: Pilot build complete, control plan validated</li>
          <li><strong>Gate 5 — Production</strong>: Full production approval, all documents signed</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Checklist Items</div>
        <p>Each gate has a checklist of required activities. Tick items as they are completed. The progress bar shows how many items are done out of the total.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Sign-Off</div>
        <p>Each gate requires sign-off from specific roles (e.g. ME Lead, Project Manager, Quality). Enter the signatory's name and date, then click <em>Sign Off</em>. A gate is only <strong>complete</strong> when all required roles have signed.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Progress on Dashboard</div>
        <p>Gate completion is shown on the <strong>Project Dashboard</strong> gate strip and fed into the <strong>Operations Dashboard</strong> project progress metrics.</p>
      </div>
    `
  },

  // ── Product Management ────────────────────────────────────────
  'product-management': {
    title: '📦 Product Management — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Product Management</strong> portal is the master catalogue of all products. It controls the lifecycle status that drives the NPI Projects view.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Product List</div>
        <p>All products with inline editing. Click any field to edit it directly. Changes are saved automatically after a short delay.</p>
        <p><strong>Status options:</strong> Tender → NPI → Production → Closed. Changing status here moves the product card between lanes in the NPI Projects view.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Overhaul Trends</div>
        <p>Chart showing overhaul frequency and history across all products. Useful for identifying high-turn products and planning capacity.</p>
        <p><strong>Data source:</strong> Overhaul history records added to each product row.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Product Families tab</div>
        <p>Shortcut to the <strong>Product Family Database</strong>. Assign each product to a family here to group projects in the NPI view and apply PFMEA templates.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Adding a New Product</div>
        <p>Click <em>＋ Add Product</em>. Once saved, an NPI project is automatically created and will appear in the NPI Projects list under the Tender lane.</p>
      </div>
    `
  },

  // ── Product Family Database ────────────────────────────────────
  'product-family-db': {
    title: '🏢 Product Family Database — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Product Family Database</strong> defines product families and their reusable PFMEA templates. Families group related products for filtering and bulk template application.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Families</div>
        <p>A family is a category of similar products (e.g. "HVAC Units", "Rotating Machines"). Each family has a name, description, and optional attributes. Products are assigned to a family in Product Management.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">PFMEA Templates</div>
        <p>Each family can hold a reusable PFMEA template — a pre-populated set of common failure modes, effects, and causes for that product type. When a new NPI project is created for a product in this family, the template can be applied to pre-fill the PFMEA, saving significant setup time.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Usage</div>
        <p>Assign a product to a family in <strong>Product Management</strong>. Open an NPI project's PFMEA and use <em>Apply Template</em> to import the family's standard failure modes. You can then customise the entries for the specific product.</p>
      </div>
    `
  },

  // ── Parts Database ────────────────────────────────────────────
  'parts-database': {
    title: '🔩 Parts Database — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Parts Database</strong> is a centralised catalogue of A, B and C-class parts shared across all NPI projects. Adding parts here makes them available to link into any project's BOM.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">ABC Classification</div>
        <ul class="guide-list">
          <li><strong>A — High Value / Critical</strong>: Top 10–20% of items by value. Requires tightest inventory control — track usage closely, maintain safety stock, review frequently.</li>
          <li><strong>B — Medium Value</strong>: Middle tier (~30%). Standard inventory control with periodic review.</li>
          <li><strong>C — Low Value / Common</strong>: 50–70% of unique part numbers but only ~5–10% of total inventory value. Minimal control — bulk order, infrequent review.</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Linking to Projects</div>
        <p>In any project's BOM, click <em>＋ Add from Parts Database</em> to search and add catalogue parts. This keeps part numbers consistent across all projects.</p>
      </div>
    `
  },

  // ── Production Hub ────────────────────────────────────────────
  production: {
    title: '🏭 Production Planning — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Production Planning</strong> portal manages production batch scheduling and lets you view the plan from multiple angles.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📅 Schedule</div>
        <p>Create and manage production batches. Each batch has a product, work area, quantity, start date, and end date. The schedule feeds directly into the Production Capacity plan.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📋 Plan by Product</div>
        <p>View all scheduled batches grouped by product. Useful for checking when a specific product is next scheduled and how many units are planned over time.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🏭 Plan by Work Area</div>
        <p>View batches grouped by work area (e.g. Unit 2, Unit 3). Useful for identifying work area congestion and balancing load. Work areas are configured in <strong>Capacity → Production → Settings</strong>.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Data Sources</div>
        <p>Products available for scheduling come from <strong>Product Management</strong>. Work areas come from <strong>Production Capacity → Settings</strong>. Batch data feeds into <strong>Production Capacity Dashboard</strong> and the <strong>Operations Dashboard</strong>.</p>
      </div>
    `
  },

  // ── Production Scheduling ─────────────────────────────────────
  'production-scheduling': {
    title: '📅 Production Schedule — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Schedule</strong> view is where production batches are created and managed. Each row represents a discrete production run of a product through a work area.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Batch Fields</div>
        <ul class="guide-list">
          <li><strong>Product</strong> — Selected from the Product Management catalogue</li>
          <li><strong>Work Area</strong> — Where the batch is built (Unit 2, Unit 3, etc.)</li>
          <li><strong>Quantity</strong> — Number of units in this batch</li>
          <li><strong>Start / End Date</strong> — Planned schedule window</li>
          <li><strong>Status</strong> — Planned / In Progress / Complete / On Hold</li>
          <li><strong>Notes</strong> — Any scheduling notes</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Real-Time Sync</div>
        <p>All users see schedule changes immediately. Batch edits are saved automatically after a short delay and broadcast to all connected users.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Used By</div>
        <p>Batch dates and quantities feed into the <strong>Production Capacity</strong> charts. Active batch count is shown on the <strong>Operations Dashboard</strong>.</p>
      </div>
    `
  },

  // ── Plan by Product ───────────────────────────────────────────
  'production-by-product': {
    title: '📋 Plan by Product — User Guide',
    body: `
      <div class="guide-section">
        <p><strong>Plan by Product</strong> groups all scheduled batches by product, showing you the full production history and forward schedule for each product in one view.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">How to Read It</div>
        <p>Each product is listed with its batches below. Batches are sorted by start date. Status badges show whether each batch is Planned, In Progress, Complete, or On Hold.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Data Source</div>
        <p>All data comes from the <strong>Schedule</strong> tab. Products without any scheduled batches do not appear in this view.</p>
      </div>
    `
  },

  // ── Plan by Work Area ─────────────────────────────────────────
  'production-by-unit': {
    title: '🏭 Plan by Work Area — User Guide',
    body: `
      <div class="guide-section">
        <p><strong>Plan by Work Area</strong> groups all scheduled batches by their assigned work area, showing the load on each part of the shop floor.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">How to Read It</div>
        <p>Each work area (e.g. Unit 2, Unit 3) lists all batches currently assigned to it, in date order. Useful for identifying which work areas are congested and which have capacity available.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Data Sources</div>
        <p>Work areas are defined in <strong>Capacity → Production → Settings</strong>. Batches and their work area assignments come from the <strong>Schedule</strong> tab.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Capacity vs Loading</div>
        <p>For a quantitative loading view, switch to <strong>Capacity → Production → By Work Area</strong> which shows a bar chart of scheduled units vs throughput capacity per work area per week.</p>
      </div>
    `
  },

  // ── Operations Dashboard ──────────────────────────────────────
  operations: {
    title: '🛰️ Operations Dashboard — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Operations Dashboard</strong> is a director-level command surface aggregating live data from all portals into a single view. No data is entered here — it is read-only and updates automatically.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Overview</div>
        <p>Top-level KPI cards and a Live Pulse Feed showing the current health of: ME Capacity, PM Capacity, Delivery Confidence (overdue actions + high RPN), and Production Flow. Click any card to navigate to the relevant portal.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Flow</div>
        <p>Summary of production flow: active batches, completed batches, and schedule adherence. Pulls from <strong>Production → Schedule</strong>.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Risk</div>
        <p>Aggregated view of high-risk PFMEA causes and high-severity project risks across all NPI projects. Pulls from <strong>PFMEA</strong> (RPN ≥ 100) and <strong>Risk Register</strong> (score ≥ 12).</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">People</div>
        <p>ME and PM capacity utilisation summary. Pulls from <strong>ME Capacity</strong> and <strong>PM Capacity</strong> — utilisation %, headroom hours, and team size.</p>
        <p><strong>Calculation:</strong> Utilisation = allocated hours ÷ available hours × 100%</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Actions</div>
        <p>Aggregated action tracker across all NPI projects. Shows overdue, open, and recently closed actions. Pulls from all <strong>Action Trackers</strong>.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Forecast</div>
        <p>Forward-looking entries manually added in this view (not pulled from other portals). Use to record agreed commercial forecasts, delivery commitments, or outlook notes.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">How System Health % is calculated</div>
        <p>The headline <strong>System Health %</strong> score is the average of seven signals, each scored from 0 to 100:</p>
        <ul class="guide-list">
          <li><strong>Overdue Actions</strong> — starts at 100, minus 10 for every overdue action (floor 0).</li>
          <li><strong>High RPN Causes</strong> — starts at 100, minus 2 for every PFMEA cause with an RPN of 100 or above (floor 0).</li>
          <li><strong>Gate Completion</strong> — the percentage of gate checks ticked across all active NPI projects.</li>
          <li><strong>Open Bugs</strong> — starts at 100, minus 4 for every open bug report (floor 0).</li>
          <li><strong>ME Capacity</strong> — 100 when utilisation is 85% or under; each percentage point above 85% deducts 2 points. Shows 70 if capacity data has not yet been loaded.</li>
          <li><strong>Production Completion</strong> — the percentage of tracked production batches that have been completed.</li>
          <li><strong>Forecast Utilisation</strong> — same formula as ME Capacity, applied to the 24-month weighted forecast load. Shows 70 if forecast data is not yet ready.</li>
        </ul>
        <p>The seven scores are added together and divided by seven (rounded). Colour bands: <strong>85% and above</strong> = green (good), <strong>65–84%</strong> = amber (watch), <strong>below 65%</strong> = red (critical).</p>
      </div>
    `
  },

  // ── MCS (Change Register) ────────────────────────────────────
  mcs: {
    title: '🔧 Change Register — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Change Register</strong> tracks all manufacturing, engineering, and process changes from initial request through to implementation. Each change follows a two-step approval process before it is marked as implemented.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Raising a Change</div>
        <p>Click <strong>+ Raise a Change</strong> to open the form. Fill in the change type, description, affected product, priority, and any impact details. The system auto-assigns an ECR reference number.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Approval Process</div>
        <ul class="guide-list">
          <li><strong>Open</strong> — Change raised, awaiting submission for review.</li>
          <li><strong>Awaiting Approval 1</strong> — Submitted for first sign-off. The nominated Approval 1 reviewer must approve or reject.</li>
          <li><strong>Implementing</strong> — Approval 1 granted. Change is being carried out.</li>
          <li><strong>Awaiting Approval 2</strong> — Implementation complete, awaiting final sign-off.</li>
          <li><strong>Implemented</strong> — Fully approved and closed out. Overhaul Trends updated automatically.</li>
          <li><strong>Closed</strong> — Change rejected or cancelled.</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Filters & Search</div>
        <p>Use the sidebar to filter by Status, Priority, Change Type, or Source. Use the search box to find a change by keyword. The sort dropdown lets you order by date or priority.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Activity Log</div>
        <p>Each change has a timeline showing all status changes, approvals, and comments. Anyone can post a <em>💬 Comment</em> or <em>📈 Progress Update</em> directly into the activity log.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Action Centre Integration</div>
        <p>Changes awaiting your approval appear automatically in your <strong>Action Centre</strong> under Pending Approvals — no need to check the register manually.</p>
      </div>
    `
  },

  // ── Action Centre ─────────────────────────────────────────────
  'action-centre': {
    title: '✅ Action Centre — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Action Centre</strong> is your personal work queue — a single place to see every task, risk, and approval assigned to you across all NPI projects and the Change Register.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">What appears here</div>
        <ul class="guide-list">
          <li><strong>Actions</strong> — NPI project actions where you are the listed owner.</li>
          <li><strong>PFMEA Actions</strong> — Corrective actions from PFMEA causes assigned to you.</li>
          <li><strong>Risks</strong> — Project risks where you are the owner.</li>
          <li><strong>Pending Approvals</strong> — Engineering changes awaiting your sign-off (amber panel, displayed only when you have pending approvals).</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Status indicators</div>
        <p>Items are colour-coded: <strong>red</strong> = overdue (past due date), <strong>amber</strong> = due soon, <strong>green</strong> = on track. The KPI cards at the top summarise your open and overdue counts at a glance.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Navigating to items</div>
        <p>Click <strong>Go to Project →</strong> on any action or risk to jump directly to the relevant NPI project section. Click <strong>Review ECR →</strong> on a pending approval to open the change in the Change Register.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Refreshing</div>
        <p>Data loads automatically when you open the Action Centre. Use the <strong>↺ Refresh</strong> button to pull the latest changes at any time.</p>
      </div>
    `
  },

  // ── Logistics Capacity ────────────────────────────────────────
  'capacity-logistics': {
    title: '🚚 Logistics Load Capacity — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Logistics Capacity</strong> plan tracks the Logistics department's workload against available hours. It uses the same tab structure as ME Capacity, with data separated by department tag.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📊 Capacity Chart</div>
        <p>Bar chart showing total allocated hours vs available capacity per month. Bars turn amber above 80% utilisation and red above 100%.</p>
        <p><strong>Calculation:</strong> Available hours = (working days in month × hours per day) × number of team members, minus approved holidays.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">👷 Team</div>
        <p>Add and manage Logistics team members. Set each person's hours per day and department tag. Team members appear as rows in the capacity calculations.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📋 Tasks</div>
        <p>Log ongoing tasks. Each task uses 3-point PERT estimation (optimistic, most likely, pessimistic) and contributes to the capacity chart across its assigned month range.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🚂 Product Support</div>
        <p>Assign Logistics effort to specific products — for example, kitting preparation time and product movement hours per batch.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📦 Product Load</div>
        <p>View the total Logistics hours attributed to each product, broken down by task and product support entries.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🏖️ Holiday Planner</div>
        <p>Record approved annual leave for each team member by month. Holidays reduce available capacity on the chart. UK bank holidays are automatically deducted.</p>
      </div>
    `
  },

  // ── Unit 6 Capacity ───────────────────────────────────────────
  'capacity-unit6': {
    title: '🏭 Unit 6 Load Capacity — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Unit 6 Capacity</strong> plan tracks the Unit 6 department's workload against available hours. It uses the same tab structure as ME Capacity, with data separated by department tag.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📊 Capacity Chart</div>
        <p>Bar chart showing total allocated hours vs available capacity per month. Bars turn amber above 80% utilisation and red above 100%.</p>
        <p><strong>Calculation:</strong> Available hours = (working days in month × hours per day) × number of team members, minus approved holidays.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">👷 Team</div>
        <p>Add and manage Unit 6 team members. Set each person's hours per day and department tag.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📋 Tasks</div>
        <p>Log ongoing tasks using 3-point PERT estimation. Tasks contribute to the capacity chart across their assigned month range.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🚂 Product Support</div>
        <p>Assign Unit 6 effort to specific products for recurring support work separate from project tasks.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📦 Product Load</div>
        <p>View the total Unit 6 hours attributed to each product, broken down by task and product support entries.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">🏖️ Holiday Planner</div>
        <p>Record approved annual leave for each team member by month. UK bank holidays are automatically deducted.</p>
      </div>
    `
  },

  // ── Feedback ─────────────────────────────────────────────────
  feedback: {
    title: '💬 Feedback & Bugs — User Guide',
    body: `
      <div class="guide-section">
        <p>The <strong>Feedback & Bugs</strong> portal is where team members can report issues or suggest improvements to the portal. Reports are visible to all users and can be responded to by anyone.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">✍️ Submit Tab</div>
        <p>Fill in the form to submit a new report. Choose a type (Bug or Feedback), give it a title and description, and optionally note which page it relates to. Set a priority (Low / Medium / High) to help with triage.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">📋 Browse Tab</div>
        <p>View all submitted reports. Filter by type, status, or priority. Open any item to see its full detail and add a response.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Responding</div>
        <p>Any user can respond to a report. Click a report to expand it, enter a response in the text field, and update the status. Status options: Open → In Progress → Resolved → Closed.</p>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">Real-Time Updates</div>
        <p>New submissions and status changes appear instantly for all users without needing to refresh the page.</p>
      </div>
    `
  }
}

/**
 * Opens the shared guide modal populated with content for the given key.
 * @param {string} key - Content key from GUIDE_CONTENT
 */
function showGuide(key) {
  const content = GUIDE_CONTENT[key]
  if (!content) return
  const titleEl = document.getElementById('guideModalTitle')
  const bodyEl = document.getElementById('guideModalBody')
  if (!titleEl || !bodyEl) return
  titleEl.textContent = content.title
  bodyEl.innerHTML = content.body
  showModal('modalGuide')
}
