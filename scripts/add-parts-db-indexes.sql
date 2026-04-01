-- Performance indexes for Parts Database "Used In" queries
-- Run these in Supabase SQL Editor

-- Index on abc_catalogue_id in npi_bom_items
CREATE INDEX IF NOT EXISTS npi_bom_items_abc_catalogue_id_idx
ON npi_bom_items (abc_catalogue_id);

-- Index on abc_catalogue_id in npi_bom_tree
CREATE INDEX IF NOT EXISTS npi_bom_tree_abc_catalogue_id_idx
ON npi_bom_tree (abc_catalogue_id);

-- Index on project_id in npi_bom_items (for RLS and joins)
CREATE INDEX IF NOT EXISTS npi_bom_items_project_id_idx
ON npi_bom_items (project_id);

-- Index on project_id in npi_bom_tree (for RLS and joins)
CREATE INDEX IF NOT EXISTS npi_bom_tree_project_id_idx
ON npi_bom_tree (project_id);
