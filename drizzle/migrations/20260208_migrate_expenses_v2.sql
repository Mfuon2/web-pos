-- Migration: Add incurred_date to expenses table
-- This migration:
-- 1. Adds incurred_date column
-- 2. Backfills the date from created_at timestamp

-- Step 1: Add the incurred_date column
ALTER TABLE expenses ADD COLUMN incurred_date DATE;

-- Step 2: Backfill incurred_date from created_at
-- Extract just the date portion (YYYY-MM-DD) from the timestamp
UPDATE expenses 
SET incurred_date = date(created_at) 
WHERE incurred_date IS NULL OR incurred_date = '';
