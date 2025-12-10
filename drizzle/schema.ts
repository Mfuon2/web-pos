import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Products Table
export const products = sqliteTable('products', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    barcode: text('barcode').unique(),
    price: real('price').notNull(),
    cost: real('cost').default(0),
    stock: integer('stock').default(0),
    category: text('category'),
    image: text('image'),
    deletedAt: text('deleted_at'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Suppliers Table
export const suppliers = sqliteTable('suppliers', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    contactPerson: text('contact_person'),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Sales Table
export const sales = sqliteTable('sales', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    items: text('items'), // Kept for backward compatibility
    total: real('total').notNull(),
    paymentMethod: text('payment_method'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Sale Items Table
export const saleItems = sqliteTable('sale_items', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    saleId: integer('sale_id').notNull().references(() => sales.id),
    productId: integer('product_id').notNull().references(() => products.id),
    quantity: integer('quantity').notNull(),
    price: real('price').notNull()
})

// Expenses Table
export const expenses = sqliteTable('expenses', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    category: text('category').notNull(),
    amount: real('amount').notNull(),
    description: text('description'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Purchase Orders Table
export const purchaseOrders = sqliteTable('purchase_orders', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    supplierId: integer('supplier_id').references(() => suppliers.id),
    total: real('total').notNull(),
    status: text('status').default('pending'),
    notes: text('notes'),
    receivedAt: text('received_at'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Categories Table
export const categories = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    description: text('description'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Purchase Order Items Table
export const purchaseOrderItems = sqliteTable('purchase_order_items', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    purchaseOrderId: integer('purchase_order_id').notNull().references(() => purchaseOrders.id),
    productId: integer('product_id').notNull().references(() => products.id),
    quantity: integer('quantity').notNull(),
    cost: real('cost').notNull()
})

// Users Table
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').notNull().default('cashier'),
    lastSeenAt: text('last_seen_at'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Settings Table
export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey(),
    businessName: text('business_name').notNull().default('Set Up Your Business Name'),
    primaryColor: text('primary_color').notNull().default('#667eea'),
    secondaryColor: text('secondary_color').notNull().default('#764ba2'),
    currencySymbol: text('currency_symbol').notNull().default('Ksh'),
    currencyCode: text('currency_code').notNull().default('KES'),
    taxRate: real('tax_rate').default(0),
    logoUrl: text('logo_url'),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    timezone: text('timezone').notNull().default('Africa/Nairobi'),
    setupComplete: integer('setup_complete', { mode: 'boolean' }).default(false),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})
