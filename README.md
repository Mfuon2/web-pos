# Modern Cloud POS System

> A complete, cloud-native Point of Sale solution built with Vue 3 and Cloudflare's edge infrastructure. Perfect for retail businesses looking for a fast, reliable, and fully customizable POS system.

[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)](https://pages.cloudflare.com/)
[![D1 Database](https://img.shields.io/badge/Database-D1-blue.svg)](https://developers.cloudflare.com/d1/)

---

## Why Choose This POS System?

### **Lightning Fast Performance**
- Built on Cloudflare's global edge network for sub-100ms response times
- Progressive Web App (PWA) with offline capabilities
- Instant checkout with barcode scanning support
- Real-time inventory updates

### **Fully Customizable Branding**
- Configure your business name, colors, and branding
- Dynamic color schemes that apply across the entire app
- Custom logo support
- First-time setup wizard for quick onboarding

### **Complete Financial Management**
- Real-time dashboard with key metrics
- Comprehensive sales tracking and reporting
- Expense management and categorization
- Profit & Loss statements
-Tax rate configuration
- Multi-currency support

### **Powerful Inventory Control**
- Full product catalog management
- Real-time stock tracking
- Category organization
- Purchase order management
- Supplier relationship management
- Low stock alerts

### **Multi-User Support with Role-Based Access**
- Admin and cashier roles
- Secure authentication
- User activity tracking
- Role-based view restrictions

###  **Mobile-First Design**
- Fully responsive on all devices
- Touch-optimized interface
- Works on tablets and smartphones
- Offline mode for uninterrupted service

---

## Core Features

### Dashboard & Analytics
- **Real-time Metrics**: Today's sales, revenue, and profit at a glance
- **Sales Trends**: Visual charts and graphs
- **Quick Actions**: Fast access to common tasks
- **Recent Activity**: Latest transactions and updates

### POS Terminal
- **Fast Checkout**: Add products with a click or barcode scan
- **Cart Management**: Easy quantity adjustments and item removal
- **Multiple Payment Methods**: Cash and card support
- **Receipt Generation**: Automatic transaction records
- **Mobile Cart**: Full-screen cart view on mobile devices

### Inventory Management
- **Product CRUD**: Create, read, update, delete products
- **Barcode Support**: Unique barcodes for each product
- **Category Organization**: Group products for easy navigation
- **Stock Tracking**: Real-time inventory levels
- **Cost & Pricing**: Manage product costs and selling prices
- **Soft Delete**: Products can be archived instead of permanently deleted

### Financial Reports
- **Sales Summary**: Daily, weekly, monthly revenue reports
- **Expense Tracking**: Record and categorize business expenses
- **Profit & Loss**: Automatic P&L calculation
- **Date Filtering**: Custom date range reports
- **Export Capabilities**: Generate financial statements

### Setup & Configuration
- **Business Settings**: Configure name, branding, and contact information
- **Color Customization**: Primary and secondary color schemes
- **Currency Settings**: Symbol, code, and tax rate configuration
- **User Management**: Create and manage staff accounts
- **Supplier Management**: Maintain supplier relationships
- **Category Management**: Organize product categories

### Security & Authentication
- **Secure Login**: Username/password authentication
- **Role-Based Access**: Admin and cashier permissions
- **Session Management**: Automatic logout for security
- **Password Hashing**: Bcrypt encryption for user passwords

---

## Technical Architecture

### Frontend Stack
- **Vue 3** (Composition API) - Modern, reactive UI framework
- **Pinia** - State management for predictable data flow
- **Vue Router** - Client-side routing for SPA experience
- **Vite** - Lightning-fast build tool and dev server
- **Lucide Icons** - Beautiful, consistent iconography
- **PWA** - Progressive Web App with offline support

### Backend Stack
- **Cloudflare Pages Functions** - Serverless API endpoints
- **Cloudflare D1** - SQLite-based edge database
- **RESTful API** - Standard HTTP methods for all operations
- **CORS Middleware** - Cross-origin request handling

### Database Design
- **Normalized Schema**: Efficient relational data structure
- **Foreign Keys**: Data integrity constraints
- **Indexes**: Optimized for fast queries
- **Soft Deletes**: Preserve historical data
- **Atomic Transactions**: Ensure data consistency

---

## Project Structure

```
pos-system/
├── functions/                  # Serverless Backend API
│   ├── _middleware.js         # CORS & Error Handling
│   └── api/
│       ├── products/          # Product Management
│       ├── sales/             # Sales Transactions
│       ├── expenses/          # Expense Tracking
│       ├── suppliers/         # Supplier Management
│       ├── categories/        # Category Management
│       ├── users/             # User Management
│       ├── settings/          # Business Configuration
│       ├── auth/              # Authentication
│       ├── purchase-orders/   # Purchase Orders
│       └── reports/           # Financial Reports
│
├── src/                       # Vue Frontend
│   ├── components/           # Reusable UI Components
│   │   ├── Navbar.vue        # Navigation Bar
│   │   ├── ProductCard.vue   # Product Display Card
│   │   ├── GlassDialog.vue   # Modal Dialog System
│   │   ├── ExpenseModal.vue  # Expense Entry Form
│   │   ├── SetupWizard.vue   # First-Time Setup
│   │   └── PaginationControls.vue
│   │
│   ├── views/                # Main Application Views
│   │   ├── Login.vue         # Authentication
│   │   ├── Dashboard.vue     # Overview & Metrics
│   │   ├── PosTerminal.vue   # Point of Sale
│   │   ├── Inventory.vue     # Product Management
│   │   ├── Sales.vue         # Sales History
│   │   ├── SalesSummary.vue  # Sales Analytics
│   │   ├── Financials.vue    # Financial Reports
│   │   └── Setups.vue        # Configuration
│   │
│   ├── stores/               # Pinia State Management
│   │   ├── authStore.js      # Authentication State
│   │   ├── productStore.js   # Product Data
│   │   ├── cartStore.js      # Shopping Cart
│   │   ├── categoryStore.js  # Categories
│   │   ├── supplierStore.js  # Suppliers
│   │   ├── userStore.js      # User Management
│   │   ├── settingsStore.js  # Business Settings
│   │   └── dialogStore.js    # UI Dialogs
│   │
│   ├── router/               # Vue Router Configuration
│   ├── utils/                # Helper Functions
│   ├── base.css              # Design System Variables
│   └── style.css             # Global Styles
│
├── public/                    # Static Assets
│   ├── manifest.json         # PWA Manifest
│   ├── sw.js                 # Service Worker
│   └── icons/                # App Icons
│
├── schema.sql                # Database Schema
├── wrangler.toml             # Cloudflare Configuration
└── package.json              # Dependencies

```

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account (free tier works!)

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd pos-system

# Install dependencies
npm install
```

### 2. Database Setup

```bash
# Create D1 database
npx wrangler d1 create pos_database

# Update wrangler.toml with your database_id

# Apply schema to local database (development)
npx wrangler d1 execute pos_database --local --file=./schema.sql

# Apply schema to remote database (production)
npx wrangler d1 execute pos_database --remote --file=./schema.sql
```

### 3. Development

Run both servers in separate terminals:

**Terminal 1 - Frontend**
```bash
npm run dev
# → http://localhost:5173
```

**Terminal 2 - Backend**
```bash
npm run dev:backend
# → http://localhost:8788
```

### 4. First Login

Open http://localhost:5173 and login with:
- **Username**: `admin`
- **Password**: `admin123`

**Important**: Complete the first-time setup wizard to configure your business!

### 5. Production Deployment

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
npm run pages:deploy
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products (with pagination)
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Soft delete product

### Sales
- `GET /api/sales` - List sales transactions
- `POST /api/sales` - Create sale (atomic transaction with stock update)
- `GET /api/sales/:id` - Get sale details

### Inventory
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/purchase-orders` - List purchase orders
- `POST /api/purchase-orders` - Create purchase order

### Financial
- `GET /api/expenses` - List expenses (with date filters)
- `POST /api/expenses` - Create expense
- `GET /api/reports/summary` - Financial P&L summary

### Configuration
- `GET /api/settings` - Get business settings
- `PUT /api/settings` - Update business settings
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)

---

## Database Schema

### Core Tables
- **settings** - Business configuration (name, colors, currency, tax)
- **products** - Product catalog (name, barcode, price, stock, category)
- **categories** - Product categorization
- **suppliers** - Supplier information
- **sales** - Sales transactions (total, payment_method, timestamp)
- **sale_items** - Line items for each sale
- **expenses** - Operational expense tracking
- **purchase_orders** - Inventory replenishment orders
- **purchase_order_items** - Line items for purchase orders
- **users** - Staff accounts with role-based access

All tables include appropriate indexes, foreign keys, and timestamps for optimal performance and data integrity.

---

## Customization & Branding

### Business Settings
Access the Settings tab in Setups & Configuration to customize:

- **Business Name**: Appears in navbar and login screen
- **Primary Color**: Main brand color used throughout the app
- **Secondary Color**: Accent color for gradients and highlights
- **Currency**: Symbol and code (e.g., $, USD)
- **Tax Rate**: Default tax percentage
- **Contact Information**: Address, phone, email
- **Logo**: Custom logo URL

### Color Customization
The app uses CSS variables for theming. Colors configured in settings automatically apply to:
- Navigation bar
- Buttons and CTAs
- Gradients and highlights
- Login screen
- Cards and panels

---

## Security Features

- **Password Hashing**: Bcrypt with 10 salt rounds
- **Role-Based Access Control**: Admin and cashier roles
- **Session Management**: Secure authentication tokens
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **CORS Protection**: Configured middleware

---

## Mobile & PWA Features

- **Responsive Design**: Works on all screen sizes
- **Touch Optimized**: Large tap targets for mobile
- **Offline Mode**: Service worker for offline functionality
- **Add to Home Screen**: Install as native app
- **Fast Loading**: Optimized assets and code splitting

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Key Highlights

✅ **Zero Infrastructure Management** - Runs entirely on Cloudflare's edge  
✅ **Global Performance** - Fast anywhere in the world  
✅ **Cost Effective** - Free tier supports thousands of transactions  
✅ **Fully Customizable** - Adapt to any business needs  
✅ **Modern Stack** - Built with latest web technologies  
✅ **Production Ready** - Battle-tested features and security  
✅ **Mobile First** - Perfect for tablets and phones  
✅ **Developer Friendly** - Clean code, well documented  

---

## 📞 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Built using Vue 3 and Cloudflare**
