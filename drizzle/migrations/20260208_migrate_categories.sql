-- Migration: Convert product categories from string to foreign key reference
-- This migration:
-- 1. Creates categories for all unique category strings in products
-- 2. Updates products to reference category IDs
-- 3. Drops the legacy category column

-- Step 1: Insert all unique categories from products table
-- Using INSERT OR IGNORE to handle duplicates safely
INSERT OR IGNORE INTO categories (name) 
SELECT DISTINCT TRIM(category) 
FROM products 
WHERE category IS NOT NULL 
  AND category != '' 
  AND category_id IS NULL;

-- Step 2: Update products to reference the category IDs
-- This matches categories case-insensitively
UPDATE products 
SET category_id = (
  SELECT id 
  FROM categories 
  WHERE LOWER(TRIM(categories.name)) = LOWER(TRIM(products.category)) 
  LIMIT 1
)
WHERE category IS NOT NULL 
  AND category != '' 
  AND category_id IS NULL;

-- Step 3: Drop the legacy category column (if it exists)
-- Note: SQLite doesn't support DROP COLUMN IF EXISTS, so this may error if already dropped
-- The migration runner handles this gracefully
ALTER TABLE products DROP COLUMN category;
