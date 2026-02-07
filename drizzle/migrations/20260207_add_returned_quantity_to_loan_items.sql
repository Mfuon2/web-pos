-- Migration: Add returned_quantity to loan_items table
-- Run this SQL against your D1 database

ALTER TABLE loan_items ADD COLUMN returned_quantity INTEGER DEFAULT 0;
