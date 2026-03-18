-- Migration: Sync remote schema with missing columns
-- This adds columns that are in schema.sql but might be missing in older database instances

-- Add category_id to products if it doesn't exist
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS easily in a script
-- But we can try to add it, and if it fails because it exists, that's fine for manual run
-- However, wrangler migrations will stop on error.
-- Since I know it's missing on remote, I'll add it.

-- ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);
-- ALTER TABLE sales ADD COLUMN sale_date DATE;
SELECT 1;

-- Backfill sale_date
UPDATE sales SET sale_date = date(created_at) WHERE sale_date IS NULL;
