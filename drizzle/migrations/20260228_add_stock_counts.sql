-- Migration: Add stock counts tables

CREATE TABLE IF NOT EXISTS stock_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT DEFAULT 'draft',
    counted_by INTEGER,
    reconciled_by INTEGER,
    reconciled_at DATETIME,
    count_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (counted_by) REFERENCES users(id),
    FOREIGN KEY (reconciled_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS stock_count_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_count_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    system_count INTEGER NOT NULL,
    actual_count INTEGER,
    variance INTEGER,
    reason TEXT,
    FOREIGN KEY (stock_count_id) REFERENCES stock_counts(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
SELECT 1;
