-- Migration to clear sales history for production launch
-- This script removes all data from sales and sale_items tables
-- and resets their autoincrement counters.

DELETE FROM sale_items;
DELETE FROM sales;

-- Reset autoincrement sequences to start from 1 again
DELETE FROM sqlite_sequence WHERE name = 'sales';
DELETE FROM sqlite_sequence WHERE name = 'sale_items';
