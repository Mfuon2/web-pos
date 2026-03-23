-- ALTER TABLE borrowed_items ADD COLUMN borrowed_at DATE;
SELECT 1;
UPDATE borrowed_items SET borrowed_at = date(created_at);
