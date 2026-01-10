-- Migration to reset all product stock levels to zero
-- This is useful for production launch to start with a fresh inventory count

UPDATE products SET stock = 0;
