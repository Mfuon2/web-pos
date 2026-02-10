-- Migration: Separate stock counts from products table
-- This migration:
-- 1. Recreates the stock table with the correct schema
-- 2. Migrates stock data from products table
-- 3. Drops the legacy stock column from products

-- Step 1: Recreate stock table with proper schema
DROP TABLE IF EXISTS stock;

CREATE TABLE stock (
  product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Migrate stock data from products table
INSERT OR REPLACE INTO stock (product_id, count, updated_at)
SELECT id, stock, CURRENT_TIMESTAMP 
FROM products 
WHERE stock IS NOT NULL;

-- Step 3: Drop the legacy stock column from products
-- Note: SQLite doesn't support DROP COLUMN IF EXISTS, so this may error if already dropped
-- The migration runner handles this gracefully
ALTER TABLE products DROP COLUMN stock;
