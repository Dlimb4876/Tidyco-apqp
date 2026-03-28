# Capacity Management Hub

## Overview
The **Capacity Management Hub** is the central interface for coordinating resource availability and demand across distinct operational streams. It facilitates the alignment of labor hours with production requirements and project tasks, enabling data-driven decision-making for Manufacturing Engineering (ME), Product Management (PM), Logistics, and Production Support teams.

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

## The Capacity Calculation Model
### Supply-Side: Available Hours
The system calculates net availability by aggregating individual team member schedules and subtracting non-productive time:
- **Base Capacity:** (Total Team Members × Working Days × Daily Hours).
- **Absence Deductions:** Automation-integrated subtraction of Bank Holidays and approved annual leave.
- **Contractual Adjustments:** Prorated calculations for part-time or flexible working arrangements.

### Demand-Side: Total Requirement
Resource demand is derived from two primary sources:
1. **Task-Based Demand:** Manually allocated hours for specific projects, NPI activities, or MCS implementation tasks.
2. **Product Support Demand:** Algorithmic calculation based on the **Production Schedule** (Batch Quantity × Support Hours per Unit).

### Performance Metrics
- **Headroom:** The remaining unallocated hours available for contingency or new work.
- **Utilisation Thresholds:**
  - **< 80% (Green):** Sustainable loading; capacity exists for additional tasks.
  - **80% - 100% (Amber):** Optimal loading; requires active monitoring of task completion.
  - **> 100% (Red):** Overload state; requires immediate resource reallocation or schedule adjustment.

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
