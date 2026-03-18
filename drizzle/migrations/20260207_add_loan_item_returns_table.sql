CREATE TABLE IF NOT EXISTS loan_item_returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    replacement_product_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_item_id) REFERENCES loan_items(id),
    FOREIGN KEY (replacement_product_id) REFERENCES products(id)
);
SELECT 1;
