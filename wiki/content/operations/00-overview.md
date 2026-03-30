# Operations

## What this area is for
Operations is the cross-functional control tower for the entire platform.
It brings together live signals from production, capacity, risks, and actions so teams can spot issues early and respond quickly.

Unlike departmental views (like Capacity or Production), Operations shows the big picture across all functions.

## When to use Operations

### Daily stand-ups
Start your day here to see what needs immediate attention.

### Weekly management reviews
Use the data to drive decisions and allocate resources.

### Escalation meetings
Show the cross-functional impact of issues when they need senior attention.

### Monthly business reviews
Present trends and patterns to leadership.

## What each tab gives you

### Overview Tab
The executive summary of system health:
- **Key Metrics:** Production status, capacity utilisation, action counts
- **Traffic Light Status:** Quick visual of overall health
- **Trend Indicators:** Week-on-week or month-on-month changes
- **Alert Summary:** Count of items requiring attention

**Best for:** Daily check-ins and executive reporting

### Flow Tab
Throughput and schedule health across the production schedule:
- **Batch Status:** What's running, what's queued, what's complete
- **Schedule Adherence:** Planned vs actual dates
- **Bottleneck Identification:** Where work is piling up
- **Throughput Rates:** Units per day/week performance

**Best for:** Production planning and schedule management

### Risk Tab
The most serious risk signals from across the platform:
- **High Severity Risks:** PFMEA items with severity 8+ that are open
- **Risk Trends:** Increasing or decreasing risk counts
- **Source Breakdown:** Which modules are generating risks (NPI, MCS, etc.)
- **Mitigation Status:** Actions in place vs risks uncontrolled

**Best for:** Risk review meetings and quality assurance

### People Tab
Capacity pressure and utilisation across all teams:
- **Utilisation Heatmap:** Visual overview of who is overloaded
- **Team Breakdown:** ME, PM, Logistics, Unit 6 status
- **Overallocations:** Specific months where demand exceeds supply
- **Headroom Analysis:** Where spare capacity exists

**Best for:** Resource planning and workload balancing

### Actions Tab
Open and overdue execution items from all sources:
- **Action Counts:** By status, priority, and source
- **Overdue Items:** What should have been done already
- **Ownership View:** Who has the most open actions
- **Source Breakdown:** Actions from NPI, PFMEA, MCS, etc.

**Best for:** Action tracking and accountability reviews

### Forecast Tab
Forward-looking commitments and assumptions:
- **Delivery Forecasts:** When batches will complete based on current data
- **Capacity Projections:** Future utilisation predictions
- **Risk Forecast:** Predicted issues based on current trends
- **Milestone Tracking:** Key dates and dependencies

**Best for:** Strategic planning and customer communication

## High-level workflow
1. Start on Overview for health and alerts.
2. Check Flow for schedule pressure.
3. Check Risk and Actions for open exposure.
4. Check People for overload and headroom.
5. Use Forecast to plan next decisions.
6. Convert findings into owned actions.

## The control tower concept

### Situational awareness
Operations gives you a single view of truth. Instead of checking five different modules, you see everything in one place.

### Early warning system
Alerts and red indicators appear before problems become crises. A capacity overload next month is easier to fix than a production stop this week.

### Decision support
Data is presented to help you make decisions:
- Is this a one-off or a trend?
- Which team has capacity to help?
- What happens if we delay this batch?

### Escalation clarity
When issues need senior attention, Operations provides the evidence:
- Visual proof of the problem
- Cross-functional impact
- Trend data showing if it's getting worse

## Typical Operations workflows

### Morning check (10 minutes)
1. Open Operations → Overview tab
2. Check for red alerts
3. Review overdue actions count
4. Note any capacity warnings
5. Click through to detailed tabs if concerns exist

### Weekly operations meeting (30 minutes)
1. Review last week's actions - what got done?
2. Check Flow tab for schedule adherence
3. Review Risk tab for new high-severity items
4. Discuss People tab overloads and rebalancing
5. Agree priorities for the coming week
6. Update Forecast tab assumptions

### Monthly review (1 hour)
1. Trend analysis - are metrics improving?
2. Capacity planning - next quarter's resources
3. Risk review - systemic issues and mitigation
4. Forecast accuracy - how well did we predict?
5. Process improvements - what needs to change?

## How this links to other systems

### Production
- Real-time batch status feeds the Flow tab
- Schedule changes immediately update capacity projections
- Throughput data validates planning assumptions

### Capacity
- Team utilisation displays in the People tab
- Overload alerts trigger when thresholds exceeded
- Resource balancing decisions use capacity data

### Product Development (NPI)
- Project risks appear in the Risk tab
- Gate dates feed into Forecast milestones
- Action items from NPI show in Actions tab

### MCS
- Change requests pending approval appear in Actions
- Implementation status affects Production Flow
- Risk assessments feed into Risk tab

### Action Centre
- Operations shows aggregate action data
- Action Centre shows individual task details
- Updates in either place sync both views

## Key performance indicators (KPIs)

### Health metrics
- **Schedule Adherence %:** On-time batch completions
- **Capacity Utilisation %:** Average across all teams
- **Action Closure Rate %:** Actions completed vs created
- **Risk Mitigation Rate %:** High risks with active controls

### Alert metrics
- **Overdue Actions Count:** Items past due date
- **Overloaded Teams Count:** Teams over 100% utilisation
- **High Risk Count:** Open risks with severity 8+
- **Blocked Batches Count:** Production held for capacity/material

### Trend metrics
- **Directional arrows:** Improving (▲), stable (▶), worsening (▼)
- **Sparkline charts:** Mini charts showing recent history
- **Variance indicators:** Actual vs plan comparison

## Calculations (detailed)
These formulas are commonly used to interpret Operations performance.

### Schedule adherence
```text
Schedule Adherence % = (Batches Completed On or Before Due Date / Total Completed Batches) × 100
```

### Capacity utilisation (aggregate)
```text
Aggregate Utilisation % = (Total Demand Hours / Total Available Hours) × 100
```

### Action closure rate
```text
Action Closure Rate % = (Actions Closed in Period / Actions Created in Period) × 100
```

### High-risk containment
```text
Containment Rate % = (High Risks with Active Mitigation / Total High Risks) × 100
```

## Common Operations mistakes

### Dashboard blindness
Checking Operations daily but never acting on the alerts. Red indicators mean action is required.

### Silo interpretation
Looking at only one tab without considering cross-functional impacts. A capacity overload might be caused by a schedule change in Production.

### Static viewing
Not using the time period selectors. Always check trends, not just current state.

### Alert fatigue
Ignoring warnings because there are too many. If alerts are constant, fix the root cause, not the symptoms.

### No follow-through
Identifying issues in Operations but not creating actions to resolve them. Use the data to drive change.

## Escalation guidance

### When to escalate to department manager
- Any red alert persisting for more than 3 days
- Multiple teams overloaded simultaneously
- High-severity risks without mitigation plans

### When to escalate to senior leadership
- Systemic capacity constraints requiring recruitment
- Major schedule slippage affecting customer deliveries
- Persistent issues across multiple review cycles

### How to escalate effectively
1. Show the Operations dashboard as evidence
2. Explain cross-functional impact
3. Propose options, not just problems
4. Request specific decisions or resources

## Related
- [Operations Overview Tab](./10-overview-tab.md)
- [Operations Flow Tab](./20-flow-tab.md)
- [Operations Risk Tab](./30-risk-tab.md)
- [Operations People Tab](./40-people-tab.md)
- [Operations Actions Tab](./50-actions-tab.md)
- [Operations Forecast Tab](./60-forecast-tab.md)
- [Production Overview](../production/00-overview.md)
- [Capacity Overview](../capacity/00-overview.md)
- [Action Centre Overview](../action-centre/00-overview.md)
