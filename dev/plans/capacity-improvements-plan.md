# ME & PM Load Capacity Improvements Plan

**Created:** 2026-03-22  
**Priority:** P0-P2 (Critical to Medium)  
**Status:** Pending approval  

---

## Executive Summary

The ME (Manufacturing Engineering) and PM (Project Management) Load Capacity streams provide sophisticated man-hours planning with 18-month forecasting, individual capacity tracking, and real-time collaboration. However, several enhancements would significantly improve usability, accuracy, and insight.

**Current State:**
- ✅ Individual capacity tracking per engineer/manager
- ✅ Task-based demand with 5 categories (NPI, Improvement, Tendering, Support, Other)
- ✅ Product support commitments tracking
- ✅ Holiday planning with UK bank holidays
- ✅ 18-month forecast chart + 20-week heat map
- ✅ Real-time sync via Supabase subscriptions
- ✅ Shared data model for ME/PM with department filtering

**Key Gaps:**
- ❌ No skills/competency matching
- ❌ No bulk operations for tasks
- ❌ No historical trend analysis
- ❌ No capacity forecasting for planned leave
- ❌ No task dependencies or resource leveling
- ❌ Hardcoded utilisation thresholds
- ❌ PM fallback behavior unclear
- ❌ Mobile UX degrades with horizontal scrolling

---

## Improvement Recommendations

| Priority | Feature | Effort | Impact | Status |
|----------|---------|--------|--------|--------|
| **P0** | Centralize utilisation thresholds | Low | High (consistency) | Pending |
| **P0** | Fix PM team fallback behavior | Low | High (data integrity) | Pending |
| **P1** | Skills & competency tracking | High | High (resource matching) | Pending |
| **P1** | Bulk task operations | Medium | High (UX) | Pending |
| **P1** | Historical trend analysis | Medium | High (insight) | Pending |
| **P1** | Planned leave forecasting | Medium | Medium (accuracy) | Pending |
| **P2** | Task dependencies | High | Medium (planning) | Pending |
| **P2** | Resource leveling suggestions | High | Medium (optimization) | Pending |
| **P2** | Mobile UX improvements | Medium | Medium (accessibility) | Pending |
| **P2** | Smart task recommendations | Medium | Medium (productivity) | Pending |

**Total Estimated Effort:** ~12-18 hours development + testing  
**Risk:** Low-Medium (most changes are additive)

---

## Feature 1: Centralize Utilisation Thresholds (P0)

### Objective
Move hardcoded utilisation thresholds (80%, 100%) to centralized constants for consistency and easy tuning.

### Current Issues

**Thresholds scattered across multiple files:**
```javascript
// me-utils.js
if (percent < 80) return 'var(--green)';
if (percent < 100) return 'var(--amber)';
return 'var(--red)';

// me-heatmap.js
if (utilisation < 80) cellClass = 'underutilized';
else if (utilisation < 100) cellClass = 'at-capacity';
else cellClass = 'overloaded';

// me-chart.js (threshold zones plugin)
const amberStart = 0.8 * maxCapacity; // 80%
const redStart = maxCapacity;         // 100%
```

### Changes Required

#### 1.1 Add Constants File (`portals/capacity/js/capacity-constants.js`)

```javascript
/**
 * Load Capacity Constants
 * Centralized thresholds and configuration for ME/PM streams
 */

// Utilisation thresholds (percentages)
window.CAPACITY_UTILISATION_HEALTHY_MAX = 80;   // Green: < 80%
window.CAPACITY_UTILISATION_TIGHT_MAX = 100;    // Amber: 80-100%, Red: >100%

// Chart threshold zones (percentages of max capacity)
window.CAPACITY_CHART_GREEN_ZONE = 0.80;        // 0-80%
window.CAPACITY_CHART_AMBER_ZONE = 1.00;        // 80-100%
window.CAPACITY_CHART_RED_ZONE = 1.00;          // 100%+

// Default capacity settings
window.CAPACITY_DEFAULT_HOURS_PER_WEEK = 40;
window.CAPACITY_DEFAULT_UTILISATION = 80;       // percent
window.CAPACITY_DEFAULT_HOURS_PER_DAY = 8;

// Heat map configuration
window.CAPACITY_HEATMAP_WEEKS = 20;
window.CAPACITY_HEATMAP_CELL_WIDTH = 52;        // pixels
window.CAPACITY_HEATMAP_ROW_HEIGHT = 40;        // pixels

// Task categories
window.CAPACITY_TASK_CATEGORIES = [
  { id: 'npi', label: 'NPI', color: 'var(--chart-blue)' },
  { id: 'improvement', label: 'Improvement', color: 'var(--chart-green)' },
  { id: 'tendering', label: 'Tendering', color: 'var(--chart-amber)' },
  { id: 'support', label: 'Support', color: 'var(--chart-pink)' },
  { id: 'other', label: 'Other', color: 'var(--chart-purple)' }
];

// Status labels
window.CAPACITY_STATUS = {
  UNDERUTILIZED: { label: 'Underutilized', color: 'var(--green)' },
  AT_CAPACITY: { label: 'At Capacity', color: 'var(--amber)' },
  OVER_CAPACITY: { label: 'Over Capacity', color: 'var(--red)' }
};

// Helper functions
window.getUtilisationStatus = function(percent) {
  if (percent < CAPACITY_UTILISATION_HEALTHY_MAX) {
    return CAPACITY_STATUS.UNDERUTILIZED;
  } else if (percent < CAPACITY_UTILISATION_TIGHT_MAX) {
    return CAPACITY_STATUS.AT_CAPACITY;
  } else {
    return CAPACITY_STATUS.OVER_CAPACITY;
  }
};

window.getUtilisationColor = function(percent) {
  return getUtilisationStatus(percent).color;
};
```

#### 1.2 Update Existing Files to Use Constants

**me-utils.js:**
```javascript
// Replace inline thresholds:
window.getUtilisationColor = function(percent) {
  return window.getUtilisationColor(percent); // Use centralized function
};
```

**me-heatmap.js:**
```javascript
// Replace:
if (utilisation < 80) cellClass = 'underutilized';
else if (utilisation < 100) cellClass = 'at-capacity';
else cellClass = 'overloaded';

// With:
const status = getUtilisationStatus(utilisation);
if (status === CAPACITY_STATUS.UNDERUTILIZED) cellClass = 'underutilized';
else if (status === CAPACITY_STATUS.AT_CAPACITY) cellClass = 'at-capacity';
else cellClass = 'overloaded';
```

**me-chart.js:**
```javascript
// Replace hardcoded zone calculations:
const amberStart = 0.8 * maxCapacity;
const redStart = maxCapacity;

// With:
const amberStart = CAPACITY_CHART_AMBER_ZONE * maxCapacity;
const redStart = CAPACITY_CHART_RED_ZONE * maxCapacity;
```

### Acceptance Criteria
- [ ] Zero hardcoded 80/100 thresholds in ME/PM code
- [ ] All files import/use centralized constants
- [ ] Changing constants updates all UI elements consistently
- [ ] Constants documented with comments
- [ ] No visual regressions

### Files to Modify
1. `portals/capacity/js/capacity-constants.js` — NEW file
2. `portals/capacity/js/me-utils.js` — Use centralized functions
3. `portals/capacity/js/me-heatmap.js` — Use constants
4. `portals/capacity/js/me-chart.js` — Use constants
5. `portals/capacity/js/me-kpis.js` — Use constants

---

## Feature 2: Fix PM Team Fallback Behavior (P0)

### Objective
Clarify and fix PM capacity behavior when no PM team members exist.

### Current Issue

```javascript
// pm-capacity-data.js:17-20
getTeam() {
  const pmTeam = meFilterByDepartment(allTeam, 'PM', 'ME');
  return pmTeam.length > 0 ? pmTeam : allTeam; // ❌ Falls back to ALL team
}
```

**Problem:** When no PM team members are tagged, PM view shows ALL team members (including ME), which is confusing and incorrect.

### Options

#### Option A: Strict Department Separation (Recommended)
```javascript
getTeam() {
  const pmTeam = meFilterByDepartment(allTeam, 'PM', 'ME');
  return pmTeam; // Return empty array if no PM team
}
```

**UI Behavior:** Show empty state with "No PM team members. Add your first PM team member." button.

#### Option B: Explicit Fallback with Warning
```javascript
getTeam() {
  const pmTeam = meFilterByDepartment(allTeam, 'PM', 'ME');
  if (pmTeam.length === 0) {
    showNotification('No PM team members found. Showing all team members.', 'warning');
  }
  return pmTeam.length > 0 ? pmTeam : allTeam;
}
```

#### Option C: Auto-Create PM Team from ME
```javascript
getTeam() {
  const pmTeam = meFilterByDepartment(allTeam, 'PM', 'ME');
  if (pmTeam.length === 0 && allTeam.length > 0) {
    // Prompt user: "No PM team found. Copy ME team as PM team?"
    showPMTeamSetupPrompt();
  }
  return pmTeam.length > 0 ? pmTeam : allTeam;
}
```

### Recommended Implementation (Option A)

#### 2.1 Update PM Data Layer

```javascript
// pm-capacity-data.js
window.pmCapacityData = {
  getTeam() {
    const allTeam = meDataGetTeam();
    const pmTeam = meFilterByDepartment(allTeam, 'PM', 'ME');
    return pmTeam;
  },
  
  getTasks() {
    const allTasks = meDataGetTasks();
    const pmTasks = meFilterByDepartment(allTasks, 'PM', 'ME');
    return pmTasks;
  },
  
  getProducts() {
    const allProducts = meDataGetProducts();
    const pmProducts = meFilterByDepartment(allProducts, 'PM', 'ME');
    return pmProducts.length > 0 ? pmProducts : allProducts;
  }
};
```

#### 2.2 Add Empty State UI

```javascript
// pm-capacity.js
function renderPMEmptyState(type) {
  const messages = {
    team: {
      title: 'No PM Team Members',
      description: 'Add team members to track PM capacity. Tag them with department = "PM".',
      action: 'Add PM Team Member'
    },
    tasks: {
      title: 'No PM Tasks',
      description: 'Add tasks to track PM workload and demand.',
      action: 'Add PM Task'
    }
  };
  
  const config = messages[type];
  
  return `
    <div class="empty-state">
      <div class="empty-state-icon">📋</div>
      <h3>${config.title}</h3>
      <p>${config.description}</p>
      <button class="btn-primary" data-action="add-${type}">${config.action}</button>
    </div>
  `;
}
```

#### 2.3 CSS Styling

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: var(--bg-secondary);
  border: 2px dashed var(--border);
  border-radius: 8px;
  margin: 24px auto;
  max-width: 500px;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}
```

### Acceptance Criteria
- [ ] PM view shows only PM-tagged team members
- [ ] Empty state displayed when no PM team exists
- [ ] "Add PM Team Member" button creates team with department='PM'
- [ ] No confusing fallback to ME team
- [ ] Clear messaging in empty state

### Files to Modify
1. `portals/capacity/project-management/js/pm-capacity-data.js` — Fix fallback logic
2. `portals/capacity/project-management/js/pm-capacity.js` — Add empty state rendering
3. `portals/capacity/css/capacity-common.css` — Add empty state styles

---

## Feature 3: Skills & Competency Tracking (P1)

### Objective
Add skills/competency profiles to team members for better task matching and resource planning.

### Changes Required

#### 3.1 Data Structure (`portals/capacity/js/me-data.js`)

**Add skills array to team member:**
```javascript
{
  id: string,
  name: string,
  hoursPerWeek: number,
  utilisation: number,
  jobTitle: string,
  group: string,
  department: string,
  startDate: string,
  endDate: string,
  skills: [                    // NEW
    {
      id: string,
      name: string,
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert',
      yearsExperience: number,
      lastUsed: string,        // ISO date
      certified: boolean
    }
  ]
}
```

#### 3.2 Skills Taxonomy (`portals/capacity/js/capacity-constants.js`)

```javascript
window.CAPACITY_SKILLS_TAXONOMY = {
  // Technical Skills
  'cad-design': { name: 'CAD Design', category: 'technical' },
  'process-engineering': { name: 'Process Engineering', category: 'technical' },
  'quality-systems': { name: 'Quality Systems', category: 'technical' },
  'project-management': { name: 'Project Management', category: 'technical' },
  'cost-estimating': { name: 'Cost Estimating', category: 'technical' },
  'risk-management': { name: 'Risk Management', category: 'technical' },
  
  // Domain Skills
  'rail-systems': { name: 'Rail Systems', category: 'domain' },
  'overhaul-processes': { name: 'Overhaul Processes', category: 'domain' },
  'component-repair': { name: 'Component Repair', category: 'domain' },
  'testing-validation': { name: 'Testing & Validation', category: 'domain' },
  
  // Soft Skills
  'leadership': { name: 'Leadership', category: 'soft' },
  'communication': { name: 'Communication', category: 'soft' },
  'problem-solving': { name: 'Problem Solving', category: 'soft' }
};

window.CAPACITY_SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner', minYears: 0, description: 'Learning' },
  { id: 'intermediate', label: 'Intermediate', minYears: 1, description: 'Independent' },
  { id: 'advanced', label: 'Advanced', minYears: 3, description: 'Can teach others' },
  { id: 'expert', label: 'Expert', minYears: 5, description: 'Industry recognized' }
];
```

#### 3.3 UI: Skills Editor (`portals/capacity/js/me-team.js`)

**Add skills section to team row:**
```javascript
function renderTeamRow(member, idx) {
  return `
    <tr class="me-team-row">
      <!-- Existing columns -->
      <td><input value="${esc(member.name)}" data-field="name"></td>
      <td><input value="${esc(member.jobTitle)}" data-field="jobTitle"></td>
      <td>
        <select data-field="department">
          <option value="ME" ${member.department === 'ME' ? 'selected' : ''}>ME</option>
          <option value="PM" ${member.department === 'PM' ? 'selected' : ''}>PM</option>
        </select>
      </td>
      <!-- ... -->
      
      <!-- NEW: Skills column -->
      <td class="skills-cell">
        <button class="btn-skills" data-idx="${idx}" title="Edit skills">
          🎯 ${member.skills?.length || 0} skills
        </button>
      </td>
    </tr>
  `;
}
```

**Skills Modal:**
```javascript
function showSkillsModal(memberIdx) {
  const member = meDataGetTeam()[memberIdx];
  const modal = document.createElement('div');
  modal.className = 'modal skills-modal';
  modal.innerHTML = `
    <div class="modal-content skills-modal-content">
      <h3>Skills & Competencies: ${esc(member.name)}</h3>
      
      <div class="skills-section">
        <h4>Current Skills</h4>
        <div class="skills-list">
          ${(member.skills || []).map(skill => `
            <div class="skill-item">
              <div class="skill-header">
                <span class="skill-name">${CAPACITY_SKILLS_TAXONOMY[skill.id]?.name || skill.name}</span>
                <button class="btn-remove-skill" data-skill-id="${skill.id}">×</button>
              </div>
              <div class="skill-details">
                <span class="skill-level level-${skill.level}">${skill.level}</span>
                <span class="skill-years">${skill.yearsExperience} years</span>
                ${skill.certified ? '<span class="skill-certified">✓ Certified</span>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
        
        <h4>Add Skill</h4>
        <div class="add-skill-form">
          <select class="skill-selector">
            <option value="">Select a skill...</option>
            ${Object.entries(CAPACITY_SKILLS_TAXONOMY).map(([id, skill]) => `
              <option value="${id}">${skill.name} (${skill.category})</option>
            `).join('')}
          </select>
          
          <select class="skill-level-selector">
            ${CAPACITY_SKILL_LEVELS.map(level => `
              <option value="${level.id}">${level.label} (${level.minYears}+ years)</option>
            `).join('')}
          </select>
          
          <input type="number" class="skill-years" placeholder="Years experience" min="0" max="50">
          
          <label class="skill-certified-checkbox">
            <input type="checkbox"> Certified
          </label>
          
          <button class="btn-add-skill">Add</button>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn-primary" onclick="this.closest('.modal').remove()">Done</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.showModal();
  
  // Wire up event handlers...
}
```

#### 3.4 Task-Skills Matching (`portals/capacity/js/me-tasks.js`)

**Add required skills to task structure:**
```javascript
{
  id: string,
  name: string,
  category: string,
  type: string,
  department: string,
  assigneeId: string,
  productId: string,
  startDate: string,
  endDate: string,
  totalHours: number,
  status: string,
  requiredSkills: [          // NEW
    {
      skillId: string,
      minLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    }
  ],
  createdAt: string
}
```

**Skills mismatch warning:**
```javascript
function checkSkillsMismatch(task, assignee) {
  if (!task.requiredSkills || !assignee.skills) return [];
  
  const mismatches = [];
  
  task.requiredSkills.forEach(req => {
    const memberSkill = assignee.skills.find(s => s.id === req.skillId);
    
    if (!memberSkill) {
      mismatches.push({
        type: 'missing',
        skill: CAPACITY_SKILLS_TAXONOMY[req.skillId]?.name || req.skillId,
        message: `Missing required skill: ${req.skillId}`
      });
    } else if (skillLevelRank(memberSkill.level) < skillLevelRank(req.minLevel)) {
      mismatches.push({
        type: 'insufficient',
        skill: CAPACITY_SKILLS_TAXONOMY[req.skillId]?.name || req.skillId,
        message: `Skill level too low: ${memberSkill.level} < ${req.minLevel}`
      });
    }
  });
  
  return mismatches;
}

function skillLevelRank(level) {
  const ranks = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
  return ranks[level] || 0;
}
```

**UI Warning:**
```javascript
const mismatches = checkSkillsMismatch(task, assignee);
if (mismatches.length > 0) {
  html += `
    <div class="skills-mismatch-warning">
      ⚠️ Skills mismatch:
      <ul>
        ${mismatches.map(m => `<li>${m.message}</li>`).join('')}
      </ul>
    </div>
  `;
}
```

#### 3.5 Skills Gap Analysis Report

**New tab: Skills Gap**
```javascript
function renderSkillsGapTab() {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  
  // Aggregate required skills from all tasks
  const requiredSkills = {};
  tasks.forEach(task => {
    (task.requiredSkills || []).forEach(req => {
      if (!requiredSkills[req.skillId]) {
        requiredSkills[req.skillId] = { count: 0, levels: [] };
      }
      requiredSkills[req.skillId].count++;
      requiredSkills[req.skillId].levels.push(req.minLevel);
    });
  });
  
  // Compare with team skills
  const gaps = [];
  Object.entries(requiredSkills).forEach(([skillId, req]) => {
    const teamMembersWithSkill = team.filter(m => 
      m.skills?.some(s => s.id === skillId)
    );
    
    if (teamMembersWithSkill.length === 0) {
      gaps.push({
        skillId,
        skillName: CAPACITY_SKILLS_TAXONOMY[skillId]?.name,
        demand: req.count,
        supply: 0,
        severity: 'critical'
      });
    } else if (teamMembersWithSkill.length < Math.ceil(req.count / 3)) {
      gaps.push({
        skillId,
        skillName: CAPACITY_SKILLS_TAXONOMY[skillId]?.name,
        demand: req.count,
        supply: teamMembersWithSkill.length,
        severity: 'warning'
      });
    }
  });
  
  return `
    <div class="skills-gap-report">
      <h3>Skills Gap Analysis</h3>
      ${gaps.length === 0 ? `
        <div class="no-gaps">✓ No critical skills gaps identified</div>
      ` : `
        <table class="skills-gap-table">
          <thead>
            <tr>
              <th>Skill</th>
              <th>Demand (tasks)</th>
              <th>Supply (people)</th>
              <th>Gap</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            ${gaps.map(gap => `
              <tr class="gap-${gap.severity}">
                <td>${gap.skillName}</td>
                <td>${gap.demand}</td>
                <td>${gap.supply}</td>
                <td>${gap.demand - gap.supply}</td>
                <td><span class="severity-badge severity-${gap.severity}">${gap.severity}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}
```

### Acceptance Criteria
- [ ] Skills can be added/edited for each team member
- [ ] Skills modal displays current skills and add form
- [ ] Tasks can specify required skills
- [ ] Skills mismatch warning shows when assigning tasks
- [ ] Skills gap analysis report identifies gaps
- [ ] Skills persist to database
- [ ] Skills filter in tasks tab

### Files to Modify
1. `portals/capacity/js/capacity-constants.js` — Add skills taxonomy
2. `portals/capacity/js/me-data.js` — Add skills to data structure
3. `portals/capacity/js/me-team.js` — Add skills editor UI
4. `portals/capacity/js/me-tasks.js` — Add skills matching logic
5. `portals/capacity/css/me-team.css` — Style skills UI
6. Supabase schema — Add skills columns/tables

---

## Feature 4: Bulk Task Operations (P1)

### Objective
Enable bulk operations for common task management actions to improve efficiency.

### Changes Required

#### 4.1 Checkbox Selection (`portals/capacity/js/me-tasks.js`)

**Add checkboxes to task rows:**
```javascript
function renderTasksTable(tasks) {
  return `
    <table class="me-tasks-table">
      <thead>
        <tr>
          <th class="select-all-col">
            <input type="checkbox" id="select-all-tasks" title="Select all visible tasks">
          </th>
          <th>Task Name</th>
          <th>Category</th>
          <!-- ... other columns -->
        </tr>
      </thead>
      <tbody>
        ${tasks.map(task => `
          <tr class="task-row ${task.selected ? 'selected' : ''}" data-task-id="${task.id}">
            <td class="select-col">
              <input type="checkbox" class="task-checkbox" data-task-id="${task.id}">
            </td>
            <td>${esc(task.name)}</td>
            <td>${esc(task.category)}</td>
            <!-- ... -->
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
```

#### 4.2 Bulk Actions Toolbar

**Show when tasks selected:**
```javascript
function renderBulkActionsToolbar(selectedCount) {
  if (selectedCount === 0) return '';
  
  return `
    <div class="bulk-actions-toolbar">
      <span class="bulk-selection-count">${selectedCount} task${selectedCount > 1 ? 's' : ''} selected</span>
      
      <div class="bulk-actions-group">
        <label>Assign to:</label>
        <select class="bulk-assignee-select">
          <option value="">Select assignee...</option>
          ${meDataGetTeam().map(m => `
            <option value="${m.id}">${esc(m.name)}</option>
          `).join('')}
        </select>
        <button class="btn-bulk-action" data-action="assign">Assign</button>
      </div>
      
      <div class="bulk-actions-group">
        <label>Set category:</label>
        <select class="bulk-category-select">
          ${CAPACITY_TASK_CATEGORIES.map(cat => `
            <option value="${cat.id}">${cat.label}</option>
          `).join('')}
        </select>
        <button class="btn-bulk-action" data-action="category">Set Category</button>
      </div>
      
      <div class="bulk-actions-group">
        <label>Set status:</label>
        <select class="bulk-status-select">
          <option value="SCHEDULED">Scheduled</option>
          <option value="STARTED">Started</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <button class="btn-bulk-action" data-action="status">Set Status</button>
      </div>
      
      <div class="bulk-actions-group">
        <button class="btn-bulk-delete" data-action="delete">
          🗑️ Delete Selected
        </button>
      </div>
      
      <button class="btn-clear-selection" data-action="clear">Clear Selection</button>
    </div>
  `;
}
```

#### 4.3 Event Handlers

```javascript
// In meTasksInit():
const tasksTable = document.querySelector('.me-tasks-table');

// Select all checkbox
document.getElementById('select-all-tasks')?.addEventListener('change', (e) => {
  const checkboxes = tasksTable.querySelectorAll('.task-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = e.target.checked;
    cb.closest('.task-row').classList.toggle('selected', e.target.checked);
  });
  updateBulkActionsToolbar();
});

// Individual checkbox
tasksTable.addEventListener('change', (e) => {
  if (e.target.classList.contains('task-checkbox')) {
    e.target.closest('.task-row').classList.toggle('selected', e.target.checked);
    updateBulkActionsToolbar();
  }
});

// Bulk actions toolbar
document.querySelector('.bulk-actions-toolbar')?.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  
  switch (action) {
    case 'assign':
      bulkAssignTasks();
      break;
    case 'category':
      bulkSetCategory();
      break;
    case 'status':
      bulkSetStatus();
      break;
    case 'delete':
      bulkDeleteTasks();
      break;
    case 'clear':
      clearSelection();
      break;
  }
});
```

#### 4.4 Bulk Operation Functions

```javascript
function bulkAssignTasks() {
  const selectedIds = getSelectedTaskIds();
  const assigneeSelect = document.querySelector('.bulk-assignee-select');
  const assigneeId = assigneeSelect.value;
  
  if (!assigneeId) {
    showNotification('Please select an assignee', 'error');
    return;
  }
  
  const tasks = meDataGetTasks();
  selectedIds.forEach(id => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.assigneeId = assigneeId;
    }
  });
  
  meDataSave(false);
  meRenderTasksTab();
  showNotification(`Assigned ${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''}`, 'success');
}

function bulkDeleteTasks() {
  const selectedIds = getSelectedTaskIds();
  
  if (!confirm(`Delete ${selectedIds.length} selected task${selectedIds.length > 1 ? 's'}? This cannot be undone.`)) {
    return;
  }
  
  const tasks = meDataGetTasks();
  const filtered = tasks.filter(t => !selectedIds.includes(t.id));
  
  // Update state
  window.meDataState.tasks = filtered;
  
  meDataSave(false);
  meRenderTasksTab();
  showNotification(`Deleted ${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''}`, 'success');
}
```

#### 4.5 CSV Import (Future Enhancement)

```javascript
function showCSVImportModal() {
  const modal = document.createElement('div');
  modal.className = 'modal csv-import-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Import Tasks from CSV</h3>
      
      <div class="import-instructions">
        <p>Upload a CSV file with the following columns:</p>
        <code>name,category,assignee,startDate,endDate,totalHours,status</code>
      </div>
      
      <input type="file" class="csv-file-input" accept=".csv">
      
      <div class="import-preview"></div>
      
      <div class="modal-actions">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-import">Import</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.showModal();
}
```

### Acceptance Criteria
- [ ] Checkboxes appear on task rows
- [ ] Select all checkbox works
- [ ] Bulk actions toolbar shows when tasks selected
- [ ] Bulk assign updates all selected tasks
- [ ] Bulk category change works
- [ ] Bulk status change works
- [ ] Bulk delete with confirmation
- [ ] Clear selection button works
- [ ] Notification shows result count

### Files to Modify
1. `portals/capacity/js/me-tasks.js` — Add bulk operations logic
2. `portals/capacity/css/me-tasks.css` — Style bulk actions toolbar
3. `portals/capacity/js/me-data.js` — Support bulk save

---

## Feature 5: Historical Trend Analysis (P1)

### Objective
Add historical comparison and trend analysis to identify patterns and support better planning.

### Changes Required

#### 5.1 Historical Data View (`portals/capacity/js/me-chart.js`)

**Add "History" toggle to chart tab:**
```javascript
function renderChartTab() {
  return `
    <div class="me-chart-toolbar">
      <button class="btn-prev-month">← Prev</button>
      <input type="month" class="month-picker" value="${currentMonth}">
      <button class="btn-next-month">Next →</button>
      <button class="btn-today">Today</button>
      
      <!-- NEW: Historical comparison toggle -->
      <label class="history-toggle">
        <input type="checkbox" id="show-history-comparison">
        Show YoY Comparison
      </label>
    </div>
    
    <div class="me-chart-container">
      <canvas id="meCapacityChart"></canvas>
    </div>
    
    ${showHistoryComparison ? renderHistoricalComparison() : ''}
  `;
}
```

#### 5.2 Year-over-Year Comparison

```javascript
function renderHistoricalComparison() {
  const currentMonthData = meCalculateMonthData(currentMonth);
  const lastYearMonthData = meCalculateMonthData(getSameMonthLastYear(currentMonth));
  
  const change = {
    capacity: currentMonthData.capacity - lastYearMonthData.capacity,
    demand: currentMonthData.demand - lastYearMonthData.demand,
    utilisation: currentMonthData.utilisation - lastYearMonthData.utilisation
  };
  
  return `
    <div class="historical-comparison">
      <h4>Year-over-Year Comparison</h4>
      <div class="comparison-cards">
        <div class="comparison-card">
          <div class="comparison-label">Capacity</div>
          <div class="comparison-value">
            ${currentMonthData.capacity.toFixed(1)}h
            <span class="comparison-change ${change.capacity >= 0 ? 'positive' : 'negative'}">
              ${change.capacity >= 0 ? '↑' : '↓'} ${Math.abs(change.capacity).toFixed(1)}h
            </span>
          </div>
        </div>
        
        <div class="comparison-card">
          <div class="comparison-label">Demand</div>
          <div class="comparison-value">
            ${currentMonthData.demand.toFixed(1)}h
            <span class="comparison-change ${change.demand >= 0 ? 'positive' : 'negative'}">
              ${change.demand >= 0 ? '↑' : '↓'} ${Math.abs(change.demand).toFixed(1)}h
            </span>
          </div>
        </div>
        
        <div class="comparison-card">
          <div class="comparison-label">Utilisation</div>
          <div class="comparison-value">
            ${currentMonthData.utilisation}%
            <span class="comparison-change ${change.utilisation >= 0 ? 'positive' : 'negative'}">
              ${change.utilisation >= 0 ? '↑' : '↓'} ${Math.abs(change.utilisation)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getSameMonthLastYear(monthString) {
  const date = new Date(monthString + '-01');
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().slice(0, 7); // 'YYYY-MM'
}
```

#### 5.3 Trend Chart

**Add trend line chart:**
```javascript
function renderTrendChart() {
  const months = getLast12Months();
  const data = months.map(month => meCalculateMonthData(month));
  
  return `
    <div class="trend-chart-section">
      <h4>12-Month Trend</h4>
      <div class="trend-chart-container">
        <canvas id="meTrendChart"></canvas>
      </div>
    </div>
  `;
}

function drawTrendChart() {
  const ctx = document.getElementById('meTrendChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: getLast12Months().map(m => formatMonthLabel(m)),
      datasets: [
        {
          label: 'Capacity',
          data: data.map(d => d.capacity),
          borderColor: 'var(--red)',
          tension: 0.3
        },
        {
          label: 'Demand',
          data: data.map(d => d.demand),
          borderColor: 'var(--blue)',
          tension: 0.3
        },
        {
          label: 'Utilisation %',
          data: data.map(d => d.utilisation),
          borderColor: 'var(--amber)',
          yAxisID: 'y1',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Hours' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Utilisation %' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}
```

#### 5.4 Seasonal Pattern Detection

```javascript
function detectSeasonalPatterns() {
  const history = getHistoricalData(24); // Last 24 months
  
  // Group by month of year
  const byMonth = {};
  for (let i = 0; i < 12; i++) {
    byMonth[i] = [];
  }
  
  history.forEach((data, index) => {
    const monthOfYear = new Date(data.month).getMonth();
    byMonth[monthOfYear].push(data.demand);
  });
  
  // Calculate averages and identify patterns
  const patterns = [];
  Object.entries(byMonth).forEach(([month, demands]) => {
    const avg = demands.reduce((a, b) => a + b, 0) / demands.length;
    const overallAvg = history.reduce((a, b) => a + b.demand, 0) / history.length;
    const variance = ((avg - overallAvg) / overallAvg) * 100;
    
    if (Math.abs(variance) > 15) {
      patterns.push({
        month: parseInt(month),
        monthName: formatMonthName(parseInt(month)),
        avgDemand: avg,
        variance: variance,
        pattern: variance > 0 ? 'high' : 'low'
      });
    }
  });
  
  return patterns;
}

function renderSeasonalPatterns() {
  const patterns = detectSeasonalPatterns();
  
  if (patterns.length === 0) {
    return '<div class="no-patterns">No significant seasonal patterns detected</div>';
  }
  
  return `
    <div class="seasonal-patterns">
      <h4>Seasonal Patterns Detected</h4>
      <ul class="patterns-list">
        ${patterns.map(p => `
          <li class="pattern pattern-${p.pattern}">
            <span class="pattern-month">${p.monthName}</span>
            <span class="pattern-variance ${p.variance >= 0 ? 'positive' : 'negative'}">
              ${p.variance >= 0 ? '↑' : '↓'} ${Math.abs(p.variance).toFixed(0)}% vs average
            </span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}
```

### Acceptance Criteria
- [ ] YoY comparison toggle works
- [ ] Comparison cards show capacity, demand, utilisation changes
- [ ] 12-month trend chart displays correctly
- [ ] Seasonal patterns detected and displayed
- [ ] Historical data loads efficiently
- [ ] No performance degradation

### Files to Modify
1. `portals/capacity/js/me-chart.js` — Add historical comparison UI
2. `portals/capacity/js/me-calculations.js` — Add historical data functions
3. `portals/capacity/css/me-chart.css` — Style comparison cards and charts
4. `portals/capacity/js/capacity-utils.js` — Add date formatting helpers

---

## Feature 6: Planned Leave Forecasting (P1)

### Objective
Distinguish between approved holidays and planned/anticipated leave for better capacity forecasting.

### Changes Required

#### 6.1 Data Structure Update

**Add leave type field:**
```javascript
// me-data.js
{
  id: string,
  personId: string,
  date: string,
  type: 'full' | 'half',
  department: string,
  leaveStatus: 'approved' | 'planned' | 'pending',  // NEW
  createdAt: string
}
```

#### 6.2 Holiday Deduction Logic Update

```javascript
// me-calculations.js
function meCalculateMonthData(monthStart, monthEnd) {
  // ... existing capacity calculation ...
  
  // Separate approved vs planned leave
  const approvedHolidays = holidays.filter(h => h.leaveStatus === 'approved');
  const plannedHolidays = holidays.filter(h => h.leaveStatus === 'planned');
  
  const approvedHolidayDays = meGetHolidayDaysInRange(member.id, activeStart, activeEnd, approvedHolidays, bankHolSet);
  const plannedHolidayDays = meGetHolidayDaysInRange(member.id, activeStart, activeEnd, plannedHolidays, bankHolSet);
  
  // Calculate two scenarios
  const capacityWithApprovedOnly = grossHours - (approvedHolidayDays * dailyHours);
  const capacityWithAllLeave = grossHours - ((approvedHolidayDays + plannedHolidayDays) * dailyHours);
  
  return {
    gross: grossHours,
    approved: capacityWithApprovedOnly * (utilisation / 100),
    planned: capacityWithAllLeave * (utilisation / 100),
    capacity: capacityWithApprovedOnly * (utilisation / 100), // Use approved for now
    plannedLeaveDays: plannedHolidayDays
  };
}
```

#### 6.3 UI: Leave Status Toggle

```javascript
// me-holidays.js
function renderHolidayGrid(month, year) {
  return `
    <div class="holiday-toolbar">
      <label class="leave-status-filter">
        <input type="radio" name="leave-status" value="all" checked>
        All Leave
      </label>
      <label class="leave-status-filter">
        <input type="radio" name="leave-status" value="approved">
        Approved Only
      </label>
      <label class="leave-status-filter">
        <input type="radio" name="leave-status" value="planned">
        Planned Only
      </label>
    </div>
    
    <div class="holiday-grid">
      <!-- Grid cells -->
    </div>
  `;
}

// Click handler for holiday cells
function toggleHoliday(personId, date, currentStatus) {
  const statuses = ['none', 'planned-half', 'planned-full', 'approved-half', 'approved-full'];
  const currentIndex = statuses.indexOf(currentStatus);
  const nextStatus = statuses[(currentIndex + 1) % statuses.length];
  
  meDataUpdateHoliday(personId, date, nextStatus);
}
```

#### 6.4 Capacity Chart with Two Scenarios

```javascript
// me-chart.js
function drawChartWithScenarios() {
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        // Demand stacks (existing)
        { label: 'NPI', data: npiData, stack: 'demand' },
        { label: 'Improvement', data: improvementData, stack: 'demand' },
        // ...
        
        // Capacity scenarios
        {
          label: 'Capacity (Approved Leave)',
          data: capacityData.approved,
          type: 'line',
          borderColor: 'var(--red)',
          borderWidth: 2
        },
        {
          label: 'Capacity (incl. Planned Leave)',
          data: capacityData.planned,
          type: 'line',
          borderColor: 'var(--red)',
          borderWidth: 2,
          borderDash: [5, 5],
          opacity: 0.6
        }
      ]
    }
  });
}
```

### Acceptance Criteria
- [ ] Leave status (approved/planned) can be set per holiday
- [ ] Holiday grid shows different colors for approved vs planned
- [ ] Capacity calculation shows both scenarios
- [ ] Chart displays solid line (approved) and dashed line (incl. planned)
- [ ] Filter toggles work correctly
- [ ] Leave status persists to database

### Files to Modify
1. `portals/capacity/js/me-data.js` — Add leaveStatus field
2. `portals/capacity/js/me-calculations.js` — Add scenario calculations
3. `portals/capacity/js/me-holidays.js` — Add leave status UI
4. `portals/capacity/js/me-chart.js` — Display both scenarios
5. Supabase schema — Add leave_status column

---

## Feature 7-10: P2 Features (Summarized)

### Feature 7: Task Dependencies (P2)
**Objective:** Model task dependencies for critical path analysis

**Key Changes:**
- Add `dependencies` array to task structure: `[{ taskId, type: 'finish-to-start' | 'start-to-start' }]`
- Add Gantt chart view showing dependencies
- Add critical path highlighting
- Add dependency violation warnings

**Effort:** High (~4 hours)  
**Impact:** Medium (better planning)

---

### Feature 8: Resource Leveling Suggestions (P2)
**Objective:** Automatically suggest task reassignments to balance workload

**Key Changes:**
- Algorithm to detect overloaded team members
- Suggest reassignments based on skills match
- Show "what-if" scenarios
- One-click accept suggestions

**Effort:** High (~4 hours)  
**Impact:** Medium (optimization)

---

### Feature 9: Mobile UX Improvements (P2)
**Objective:** Improve mobile experience for heat maps and tables

**Key Changes:**
- Replace horizontal scroll with card-based layout on mobile
- Touch-friendly heat map cells (larger tap targets)
- Collapsible table rows
- Bottom sheet for drill-down modals

**Effort:** Medium (~2.5 hours)  
**Impact:** Medium (accessibility)

---

### Feature 10: Smart Task Recommendations (P2)
**Objective:** Suggest task assignments based on skills, availability, and historical patterns

**Key Changes:**
- ML-lite algorithm to analyze past assignments
- Recommend assignees when creating tasks
- Suggest task categories based on name
- Auto-schedule based on capacity patterns

**Effort:** Medium (~3 hours)  
**Impact:** Medium (productivity)

---

## Implementation Order

### Phase 1: P0 Features (Data Integrity) — ~1.5 hours
1. **Centralize Utilisation Thresholds** (~0.75 hours)
2. **Fix PM Team Fallback** (~0.75 hours)

### Phase 2: P1 Features (Core Enhancements) — ~7-9 hours
3. **Skills & Competency Tracking** (~3 hours)
4. **Bulk Task Operations** (~2 hours)
5. **Historical Trend Analysis** (~2 hours)
6. **Planned Leave Forecasting** (~1.5 hours)

### Phase 3: P2 Features (Advanced) — ~8-12 hours
7. **Task Dependencies** (~4 hours)
8. **Resource Leveling** (~4 hours)
9. **Mobile UX** (~2.5 hours)
10. **Smart Recommendations** (~3 hours)

---

## Testing Plan

### Unit Tests (`tests/capacity.test.js`)

**Thresholds:**
- [ ] `getUtilisationStatus returns correct status for given percentage`
- [ ] `All files use centralized constants`

**PM Fallback:**
- [ ] `PM capacity shows empty state when no PM team`
- [ ] `PM tasks filtered correctly by department`

**Skills:**
- [ ] `Skills can be added to team members`
- [ ] `Skills mismatch detected when assigning tasks`
- [ ] `Skills gap analysis identifies gaps`

**Bulk Operations:**
- [ ] `Select all checkbox works`
- [ ] `Bulk assign updates all selected tasks`
- [ ] `Bulk delete with confirmation`

**Historical Trends:**
- [ ] `YoY comparison calculates correctly`
- [ ] `12-month trend chart renders`
- [ ] `Seasonal patterns detected`

**Planned Leave:**
- [ ] `Leave status (approved/planned) persists`
- [ ] `Capacity shows both scenarios`
- [ ] `Holiday grid displays correct colors`

---

## Success Metrics

After implementation:

- ✅ **Data Integrity:** PM capacity shows only PM team members
- ✅ **Consistency:** Zero hardcoded thresholds
- ✅ **Efficiency:** Bulk operations reduce task management time by 60%
- ✅ **Insight:** Historical trends visible at a glance
- ✅ **Accuracy:** Planned leave reflected in forecasts
- ✅ **Matching:** Skills mismatches reduced by 80%
- ✅ **Planning:** Skills gaps identified before they become critical

---

## Notes

- All changes are backward compatible with existing data
- Skills feature requires database schema changes (new table or JSON column)
- Historical analysis requires querying past data (ensure Supabase indexes)
- Consider adding "Export to CSV" for historical data
- Mobile improvements should maintain desktop functionality

---

**Next Steps:**
1. Review and approve this plan
2. Implement Phase 1 (P0 - thresholds & PM fallback)
3. Test Phase 1
4. Implement Phase 2 (P1 - core enhancements)
5. Test Phase 2
6. Implement Phase 3 (P2 - advanced features)
7. Test Phase 3
8. Update documentation
9. Deploy to production
