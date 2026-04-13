-- Migration: Add paid_quantity tracking to borrowed_items
-- This allows tracking how many borrowed items have been paid for

-- ALTER TABLE borrowed_items ADD COLUMN paid_quantity INTEGER DEFAULT 0;
SELECT 1;
