-- Migration: Add returned_quantity tracking to borrowed_items
-- This allows tracking how many borrowed items have been returned

-- ALTER TABLE borrowed_items ADD COLUMN returned_quantity INTEGER DEFAULT 0;
SELECT 1;
