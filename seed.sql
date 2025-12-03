-- Sample test data for POS application

-- Insert sample suppliers
INSERT INTO suppliers (name, contact, email, phone) VALUES 
('ABC Wholesale', 'John Doe', 'john@abcwholesale.com', '555-0101'),
('XYZ Distributors', 'Jane Smith', 'jane@xyzdist.com', '555-0102');

-- Insert sample products
INSERT INTO products (name, barcode, price, cost, stock, category, supplier_id) VALUES 
('Coca Cola 500ml', '1234567890123', 2.50, 1.20, 100, 'Beverages', 1),
('Pepsi 500ml', '1234567890124', 2.50, 1.20, 80, 'Beverages', 1),
('Lays Chips Classic', '1234567890125', 3.00, 1.50, 120, 'Snacks', 2),
('Doritos Nacho', '1234567890126', 3.50, 1.75, 90, 'Snacks', 2),
('Water 1L', '1234567890127', 1.00, 0.40, 200, 'Beverages', 1),
('Kit Kat', '1234567890128', 1.50, 0.80, 150, 'Candy', 2),
('Snickers Bar', '1234567890129', 1.50, 0.80, 140, 'Candy', 2),
('Red Bull', '1234567890130', 4.00, 2.00, 60, 'Beverages', 1);

-- Insert sample expenses
INSERT INTO expenses (category, amount, description, created_at) VALUES 
('rent', 1500.00, 'Monthly store rent', '2024-12-01 09:00:00'),
('utilities', 200.00, 'Electricity bill', '2024-12-01 10:00:00'),
('salaries', 3000.00, 'Staff salaries', '2024-12-01 11:00:00');

-- Insert sample purchase orders
INSERT INTO purchase_orders (supplier_id, total, status, received_at, created_at, notes) VALUES 
(1, 250.00, 'received', '2024-12-01 08:00:00', '2024-11-28 10:00:00', 'Initial beverage stock'),
(2, 380.00, 'received', '2024-12-01 08:30:00', '2024-11-28 11:00:00', 'Snacks and candy restock'),
(1, 150.00, 'pending', NULL, '2024-12-01 14:00:00', 'Upcoming delivery');

-- Insert purchase order items for received orders
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, cost) VALUES 
-- PO #1 - Beverages
(1, 1, 100, 1.20),  -- Coca Cola
(1, 2, 80, 1.20),   -- Pepsi
(1, 5, 50, 0.40),   -- Water
-- PO #2 - Snacks and Candy
(2, 3, 120, 1.50),  -- Lays Chips
(2, 4, 90, 1.75),   -- Doritos
(2, 6, 80, 0.80),   -- Kit Kat
(2, 7, 70, 0.80);   -- Snickers

-- Insert a sample sale
INSERT INTO sales (total, payment_method, created_at) VALUES 
(10.00, 'cash', '2024-12-01 14:30:00');

-- Insert sale items for the sample sale
INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES 
(1, 1, 2, 2.50),
(1, 3, 1, 3.00);

-- Update stock for sold items
UPDATE products SET stock = stock - 2 WHERE id = 1;
UPDATE products SET stock = stock - 1 WHERE id = 3;
