# Settings

## What this area is for
Settings controls platform configuration and local user preferences.
It is used to keep structural reference data (like teams and roles) and appearance behavior aligned with how the organization works.

## Before you start
- Understand that some settings are **Global** (affecting all users and projects) while others are **Local** (affecting only your browser).
- You must have an Admin role to modify global permissions and teams.

## Key components
- **Permissions & Teams (Global):** Defines who can approve gates, access sensitive data, and which department users belong to.
- **Work Areas (Global):** The physical locations on the shop floor (e.g., Unit 2, Unit 6) used in Production Planning.
- **Appearance (Local):** Controls Dark/Light/Terminal themes, table density, and UI spacing for your current device.
- **MCS Approvers (Global):** Configures the default individuals responsible for signing off engineering changes.

## The configuration process
1. **Identify the scope:** Determine if the change is organizational (Global) or personal (Local).
2. **Verify access:** Ensure you have the right permissions to edit team or work area settings.
3. **Make the update:** Apply the new settings.
4. **Communicate:** If changing a global setting like a Work Area name, notify the Production team so they aren't confused by schedule changes.

## Common mistakes to avoid
- **Renaming active Work Areas:** Changing the name of "Unit 2" to something else while active production batches are scheduled there, causing confusion on the Operations dashboard.
- **Orphaned permissions:** Creating a new user but failing to assign them to a Team, leaving them unable to approve gates or see departmental data.

## Quick example
| Setting Type | Scope | Example Action | Impact |
|---|---|---|---|
| Appearance | Local | Switch to Dark Mode | Changes colors only on your current browser. |
| Teams | Global | Add "J. Doe" to "ME Team" | J. Doe now appears in ME Capacity availability. |
| Approvers | Global | Set Quality Mgr for MCS | All new ECRs will route to the Quality Mgr. |

## Related
- [Getting Started](../getting-started/00-overview.md)
- [Capacity Overview](../capacity/00-overview.md)
