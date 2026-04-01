// npi-bom-tree.js
// PURPOSE: Pure tree structure logic — traversal, node lookup, path resolution, flatten.
// Split from bom.js (Phase 1 refactor — see plans/pd-portal-refactor.md).
// No Supabase calls, no DOM, no HTML. Takes data in, returns data out.

// TODO (Phase 1): Move tree traversal and structure functions from bom.js into this file.
// Example shape:
//
// export function buildBOMTree(flatNodes) { ... }
// export function findBOMNode(tree, nodeId) { ... }
// export function getBOMNodePath(tree, nodeId) { ... }
// export function flattenBOMTree(tree) { ... }
// export function getBOMNodeDepth(tree, nodeId) { ... }
// export function getBOMNodeChildren(tree, nodeId) { ... }
