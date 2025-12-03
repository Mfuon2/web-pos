# 🏪 Vue 727 Corktails Bar with Cloudflare Pages & D1

A complete Point of Sale (POS) application built with **Vue 3**, **Cloudflare Pages Functions**, and **Cloudflare D1** database.

## 📁 Project Structure

```
vue-pos-cloudflare/
├── .gitignore
├── index.html                  # Entry point
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
├── wrangler.toml               # Cloudflare Pages & D1 Configuration
├── schema.sql                  # Database Structure
├── README.md                   # This file
├── public/
│   └── favicon.ico
├── functions/                  # SERVERLESS BACKEND (API)
│   ├── _middleware.js          # CORS & Error handling
│   └── api/
│       ├── products.js         # GET list, POST new product
│       ├── suppliers.js        # GET/POST suppliers
│       ├── sales.js            # POST new sale (Atomic Transaction)
│       ├── expenses.js         # GET/POST operational expenses
│       └── reports/
│           └── summary.js      # GET Financial P&L calculation
└── src/                        # VUE FRONTEND
    ├── main.js                 # App initialization
    ├── App.vue                 # Root Component
    ├── style.css               # Global styles
    ├── router/                 # Vue Router
    │   └── index.js
    ├── stores/                 # Pinia State Management
    │   ├── productStore.js
    │   ├── cartStore.js
    │   └── financeStore.js
    ├── components/             # Reusable UI Components
    │   ├── Navbar.vue
    │   ├── ProductCard.vue
    │   └── ExpenseModal.vue
    └── views/                  # Main Page Views
        ├── Dashboard.vue       # Overview & Quick Stats
        ├── PosTerminal.vue     # Point of Sale Interface
        ├── Inventory.vue       # Product Management
        └── Financials.vue      # Financial Reports & Expenses
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Cloudflare D1 Database:**
   ```bash
   # Create D1 database
   npx wrangler d1 create pos_database
   
   # Update wrangler.toml with the database_id returned from above
   
   # Apply schema to REMOTE database (for production)
   npx wrangler d1 execute pos_database --remote --file=./schema.sql
   
   # Apply schema to LOCAL database (for development)
   npx wrangler d1 execute pos_database --local --file=./schema.sql
   
   # (Optional) Add sample data to local database
   npx wrangler d1 execute pos_database --local --file=./seed.sql
   ```

3. **Development - Run both servers:**
   
   **Terminal 1 - Frontend:**
   ```bash
   npm run dev
   # Runs Vite dev server on http://localhost:5173
   ```
   
   **Terminal 2 - Backend:**
   ```bash
   npm run dev:backend
   # Runs Cloudflare Pages Functions on http://localhost:8788
   ```
   
   Open your browser to **http://localhost:5173**

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Deploy to Cloudflare Pages:**
   ```bash
   npm run pages:deploy
   ```

## 🎯 Features

### Frontend (Vue 3)
- ✅ **Dashboard** - Financial overview with real-time metrics
- ✅ **POS Terminal** - Fast checkout with barcode scanning
- ✅ **Inventory Management** - Product CRUD operations
- ✅ **Financial Reports** - P&L statements with date filtering
- ✅ **State Management** - Pinia stores for products, cart, and finance
- ✅ **Routing** - Vue Router for SPA navigation

### Backend (Cloudflare Pages Functions)
- ✅ **Products API** - Manage product inventory
- ✅ **Sales API** - Process transactions with automatic stock updates
- ✅ **Suppliers API** - Supplier management
- ✅ **Expenses API** - Track operational expenses
- ✅ **Reports API** - Financial summaries (Revenue, COGS, Profit)
- ✅ **CORS Middleware** - Cross-origin support

### Database (Cloudflare D1)
- ✅ SQLite-based edge database
- ✅ Optimized schema with indexes
- ✅ Foreign key relationships
- ✅ Transaction support

## 🗄️ Database Schema

See `schema.sql` for complete database structure including:
- **products** - Product catalog with pricing and stock
- **suppliers** - Supplier information
- **sales** - Sales transactions
- **sale_items** - Line items for each sale
- **expenses** - Operational expenses tracking

## 📊 API Endpoints

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product

### Sales
- `POST /api/sales` - Create sale transaction

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create new supplier

### Expenses
- `GET /api/expenses` - List expenses (with optional date filter)
- `POST /api/expenses` - Create new expense

### Reports
- `GET /api/reports/summary` - Financial P&L summary (with optional date filter)

## 🎨 Tech Stack

- **Frontend**: Vue 3 (Composition API), Vue Router, Pinia
- **Build Tool**: Vite
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Styling**: Vanilla CSS with modern gradients and animations
- **Deployment**: Cloudflare Pages (Serverless)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
