# Production

## What this area is for
Production is where planned batches are created, scheduled, and managed.
It is the operational source for what will be made, when, where, and in what quantity.

Unlike NPI (which focuses on product development), Production handles the ongoing manufacture of approved products.

## Why this area matters across the platform

### Capacity Planning
Production batches automatically calculate product-support demand in the Capacity Hub. If you schedule 10 units of Product X, and Product X requires 2 hours of support per unit, Capacity immediately shows 20 hours of demand in the appropriate month.

### Operations Control Tower
Production status feeds the Flow tab in Operations. Managers can see what's running, what's delayed, and where bottlenecks exist without checking multiple systems.

### Customer Commitments
Production schedule dates drive customer delivery promises. Accurate scheduling means reliable delivery estimates.

### Resource Allocation
Work area assignments determine which teams and equipment will be used. This affects capacity planning for those specific areas.

## The batch lifecycle

### 1. Planning
**Status: Draft**
- Batch is created with tentative dates and quantities
- Not yet visible in capacity calculations
- Used for "what-if" scenario planning

**Who does this:** Production planners, Operations managers

### 2. Scheduled
**Status: Scheduled**
- Dates and quantities confirmed
- Work area assigned
- Visible in capacity demand calculations
- Appears on Operations dashboard

**Who does this:** Production planners after confirming resources

### 3. Active
**Status: In Progress**
- Work has started on the batch
- Materials issued to the floor
- Hours being recorded against the batch
- Capacity demand converts to actual labour

**Who does this:** Shop floor supervisors when work begins

### 4. Complete
**Status: Complete**
- All operations finished
- Quality checks passed
- Goods moved to finished goods or despatch
- Actual hours and costs recorded

**Who does this:** Quality and production teams at final inspection

### 5. Archived
**Status: Archived**
- Historical record retained
- No longer affects current planning
- Available for analysis and reporting

**Automatic after:** Set period (typically 12 months) post-completion

## Main views explained

### Schedule View
The master timeline showing all batches chronologically:
- **Gantt-style display:** Visual timeline with bars representing batches
- **Drag-and-drop editing:** Move batches by dragging to new dates
- **Conflict highlighting:** Overlapping batches shown in warning colours
- **Date range navigation:** View by week, month, quarter, or custom range

**Best for:** Master scheduling and date management

### Plan by Product
Groups batches by product rather than by date:
- **Product hierarchy:** Family → Product → Variant
- **Batch history:** All batches for a specific product
- **Quantity totals:** Aggregated view of planned production
- **Performance metrics:** On-time delivery by product

**Best for:** Product-level planning and performance review

### Plan by Work Area
Groups batches by physical location:
- **Work area layout:** Unit 2, Unit 6, Assembly, Test, etc.
- **Load balancing:** Visual check of which areas are overloaded
- **Resource planning:** Equipment and labour allocation by area
- **Bottleneck identification:** Areas with excessive queue times

**Best for:** Shop floor management and resource allocation

## Key production planning concepts

### Batch sizing
- **Economic Batch Quantity (EBQ):** Optimal size balancing setup costs vs holding costs
- **Minimum Order Quantity (MOQ):** Customer or supplier-imposed minimums
- **Capacity constraints:** Maximum batch size limited by equipment or labour
- **Shelf life:** Maximum batch size limited by product expiry

### Scheduling principles
- **Forward scheduling:** Start from today and schedule forward (best for make-to-stock)
- **Backward scheduling:** Start from due date and schedule backward (best for make-to-order)
- **Finite scheduling:** Respects capacity limits (no overbooking)
- **Infinite scheduling:** Ignores capacity (shows required resources even if unavailable)

### Lead time components
```
Total Lead Time = Setup Time + (Run Time per Unit × Quantity) + Queue Time + Move Time
```

- **Setup Time:** Preparation before production starts
- **Run Time:** Actual processing time per unit
- **Queue Time:** Waiting before processing (often the largest component)
- **Move Time:** Transport between operations

## Creating a production batch

### Step-by-step process
1. **Select product:** Choose from approved product catalogue
2. **Enter quantity:** Number of units to produce
3. **Set dates:** Start date and due date (system calculates based on lead time)
4. **Assign work area:** Where the work will be performed
5. **Add notes:** Special instructions or customer references
6. **Save:** Batch created and appears in schedule

### Auto-populated fields
- **Product family:** Derived from product selection
- **Standard lead time:** From product master data
- **Support hours:** Calculated from product support rate
- **Default work area:** From product routing (if set)

## Managing schedule changes

### Moving a batch
- Drag and drop to new dates in Gantt view
- Or edit batch and change start/due dates
- System checks for capacity conflicts
- Capacity Hub automatically recalculates demand

### Splitting a batch
When you need to deliver part of an order early:
- Open batch → Split
- Enter quantity for first part
- System creates two linked batches
- Each can be scheduled independently

### Cancelling a batch
- Change status to "Cancelled"
- Reason code required (customer cancellation, material shortage, etc.)
- Released capacity automatically available for other work
- Batch retained for audit trail

### Hold and resume
- Place batch on hold to prevent scheduling
- Use for material shortages or engineering queries
- Resume when constraint resolved
- No data lost during hold period

## Integration with other modules

### Capacity
- Batch quantities × product support rate = capacity demand
- Moving a batch moves its capacity demand
- Splitting a batch splits its capacity demand proportionally

### Operations
- Batch status feeds Flow tab
- Schedule adherence calculated against plan
- Delays trigger alerts if they affect customer dates

### Product Management
- Product master data (lead times, work areas) drives batch defaults
- Product family grouping for reporting
- New products must be released before batches can be created

### MCS (Change Control)
- Engineering changes may require batch modifications
- Change requests can hold or redirect batches
- Implementation batches scheduled for change validation

## Production planning best practices

1. **Plan in rolling horizons:** Firm plans for next 4 weeks, tentative beyond
2. **Buffer for uncertainty:** Add 10-20% time buffer for queues and delays
3. **Level the load:** Avoid peaks and troughs in work area utilisation
4. **Sequence efficiently:** Group similar products to reduce changeover time
5. **Review weekly:** Update plan based on actual performance and new orders
6. **Communicate changes:** Notify affected teams when dates move
7. **Track actuals:** Record what really happened to improve future plans

## Common production mistakes

### Over-optimistic scheduling
Planning every minute of every day with no buffer for problems.

### Ignoring setup times
Scheduling back-to-back different products without changeover time.

### Static planning
Creating a schedule and never updating it as reality changes.

### Capacity blindness
Scheduling without checking if resources are available.

### Poor batch sizing
Batches too small (excessive setup) or too large (excessive inventory).

### Communication gaps
Moving dates but not telling the customer or downstream teams.

## Reporting and analysis

### Standard reports available
- **Schedule vs Actual:** Planned dates vs completion dates
- **Work Area Load:** Hours scheduled per area per period
- **Product Mix:** Quantity breakdown by product and family
- **Delivery Performance:** On-time delivery percentage
- **Capacity Utilisation:** How well capacity is being used

### Key metrics to track
- **Schedule Adherence %:** Batches completed on planned date
- **Work Area Utilisation %:** Actual hours vs available hours
- **Batch Cycle Time:** Average time from start to completion
- **On-Time Delivery %:** Deliveries meeting customer promise date
- **Planning Accuracy %:** Planned dates vs actual dates variance

## Related
- [Schedule](./10-schedule.md)
- [Plan by Product](./20-plan-by-product.md)
- [Plan by Work Area](./30-plan-by-work-area.md)
- [Capacity Overview](../capacity/00-overview.md)
- [Capacity Hub](../capacity/10-capacity-hub.md)
- [Operations Overview](../operations/00-overview.md)
- [Product Management Overview](../product-management/00-overview.md)
