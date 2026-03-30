# Capacity Management Hub

## Overview
The **Capacity Management Hub** is the main page for balancing available people hours against planned work demand.

It supports four streams:
- Manufacturing Engineering (ME)
- Product Management (PM)
- Logistics
- Unit 6

Use this page to answer one core question: **Do we have enough capacity to deliver the planned work?**

## Access
- **Portal:** Capacity
- **Tab/Sub-tab:** Hub
- **URL:** `index.html?portal=capacity`

## Key Fields and Controls
| Field/Control | Description | Functional Impact |
|:---|:---|:---|
| **Stream Selector** | Functional area filter (e.g., ME, PM, Unit 6). | Segregates data to ensure relevant resource allocation. |
| **Available Hours** | Gross labor capacity minus planned absences. | Establishes the baseline for supply-side planning. |
| **Total Demand** | Sum of task-based and product-support hours. | Defines the total resource requirement for a given period. |
| **Utilisation %** | Ratio of Total Demand to Available Hours. | Triggers visual alerts (Red/Amber/Green) for load balancing. |

## High-level workflow
1. Select the stream you are planning for.
2. Check available hours for the period.
3. Review task and product support demand.
4. Identify overloads using utilisation and headroom.
5. Rebalance demand (move dates, reassign work, or adjust plan assumptions).

## Calculations (detailed)
### 1) Available Hours
Available hours represent net team capacity after planned absences.

```text
Available Hours = Base Team Hours - Planned Absence Hours
```

Where:
- **Base Team Hours** reflects planned working time for the team in the selected period
- **Planned Absence Hours** includes holidays and other non-working periods

### 2) Total Demand
Total demand combines planned task effort and product-support effort.

```text
Total Demand = Task Demand Hours + Product Support Hours
```

Product support is linked to the Production Schedule and product support assumptions.

### 3) Utilisation %
Utilisation compares demand to available capacity.

```text
Utilisation % = (Total Demand / Available Hours) × 100
```

Interpretation:
- **Under 80%:** Capacity headroom available
- **80% to 100%:** High but manageable load
- **Over 100%:** Overloaded; action needed

## Operational Workflow
### Resource Load Balancing
Planners utilize the Hub to identify and mitigate capacity constraints:
- **Demand Leveling:** Shifting task start dates to months with higher headroom.
- **Supply Augmentation:** Adjusting team composition or overtime allocations to meet surge demand.
- **Cross-Stream Coordination:** Reallocating multi-skilled resources between streams (e.g., moving ME support to PM tasks) during peak periods.

## Common Issues and Resolutions
| Issue | Potential Cause | Remediation |
|:---|:---|:---|
| **Negative Headroom** | Underestimated task duration or unplanned absence. | Review and extend task timelines or reassign to under-utilized teams. |
| **Data Mismatch** | Incorrect 'Support Hours per Unit' in Product setup. | Update the master product data in **Product Management**. |
| **Missing Absences** | Holiday requests not synchronized. | Verify holiday data entry in the **Holiday Planner**. |

## Related
- [Manufacturing Engineering (ME) Capacity](./20-me-capacity.md)
- [Product Management (PM) Capacity](./30-pm-capacity.md)
- [Logistics and Unit 6 Planning](./40-logistics-capacity.md)
- [Production Schedule Integration](../production/10-schedule.md)
