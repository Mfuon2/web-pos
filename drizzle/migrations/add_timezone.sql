-- Migration: Add timezone column to settings table
-- Run this SQL against your D1 database

ALTER TABLE settings ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi';
