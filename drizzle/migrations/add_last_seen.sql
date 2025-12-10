-- Add last_seen_at column to users table for online status tracking
ALTER TABLE users ADD COLUMN last_seen_at DATETIME;
