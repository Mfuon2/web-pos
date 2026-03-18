-- Migration to reset all product stock levels to zero
-- This is useful for production launch to start with a fresh inventory count

UPDATE stock SET count = 0;
SELECT 1;
