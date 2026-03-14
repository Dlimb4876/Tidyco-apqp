-- Fix HVACC typo in products and programmes tables
-- Run this in Supabase SQL Editor

-- First, check what data has the typo
SELECT 'products' as table_name, id, name, family 
FROM products 
WHERE family = 'HVACC';

SELECT 'programmes' as table_name, id, name, family 
FROM programmes 
WHERE data->>'family' = 'HVACC' OR family = 'HVACC';

-- Fix products table
UPDATE products 
SET family = 'HVAC', 
    updated_at = NOW()
WHERE family = 'HVACC';

-- Fix programmes table (JSON blob in data column)
UPDATE programmes 
SET data = jsonb_set(data, '{family}', '"HVAC"')
WHERE data->>'family' = 'HVACC';

-- Also update the direct family column if it exists
UPDATE programmes 
SET family = 'HVAC'
WHERE family = 'HVACC';

-- Verify the fix
SELECT 'products after fix' as table_name, COUNT(*) as fixed_count 
FROM products 
WHERE family = 'HVAC';

SELECT 'programmes after fix' as table_name, COUNT(*) as fixed_count 
FROM programmes 
WHERE data->>'family' = 'HVAC' OR family = 'HVAC';
