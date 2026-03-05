-- Add payment verification columns to sale_items table
ALTER TABLE sale_items ADD COLUMN payment_status TEXT DEFAULT 'unverified';
ALTER TABLE sale_items ADD COLUMN verified_by INTEGER REFERENCES users(id);
ALTER TABLE sale_items ADD COLUMN verified_at DATETIME;

-- Update existing records to reflect the new default
UPDATE sale_items SET payment_status = 'unverified' WHERE payment_status IS NULL;
