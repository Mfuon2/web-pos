-- Add paid_amount to borrowed_items
ALTER TABLE borrowed_items ADD COLUMN paid_amount REAL DEFAULT 0;
