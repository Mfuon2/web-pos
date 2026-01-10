# CloudPOS

**A cloud-native Point of Sale system built on Cloudflare's global edge network.**

[![Vue 3](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Pinia](https://img.shields.io/badge/Pinia-State-FADA5E?logo=pinia&logoColor=white)](https://pinia.vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Wrangler](https://img.shields.io/badge/Wrangler-CLI-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/wrangler/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Overview

CloudPOS eliminates the complexity and cost of traditional POS infrastructure. By leveraging Cloudflare's edge computing platform, businesses get enterprise-grade performance with zero server management.

**Key Benefits:**

- **Sub-100ms response times** via 200+ global edge locations
- **Zero infrastructure** — runs entirely serverless
- **Cost-effective** — free tier supports thousands of daily transactions
- **Cross-platform** — PWA works on desktop, tablet, and mobile
- **Secure** — role-based access control with encrypted credentials

---

## Features

| Module | Capabilities |
|--------|--------------|
| **Point of Sale** | Barcode scanning, cart management, multi-payment methods, receipt generation |
| **Inventory** | Product catalog, stock tracking, categories, supplier management, purchase orders |
| **Financials** | Sales analytics, expense tracking, P&L statements, date-range reporting |
| **User Management** | Admin/cashier roles, secure authentication, session management |
| **Configuration** | Custom branding, color themes, currency settings, tax rates |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, Pinia, Tailwind CSS, Lucide Icons |
| Backend | Cloudflare Pages Functions |
| Database | Cloudflare D1 (Edge SQLite) |
| Build | Vite, Drizzle ORM |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- Cloudflare account ([sign up free](https://dash.cloudflare.com/sign-up))
- Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
# Clone the repository
git clone https://github.com/Mfuon2/web-pos.git
cd web-pos

# Install dependencies
npm install
```

### Database Setup

```bash
# Authenticate with Cloudflare
npx wrangler login

# Create the D1 database
npx wrangler d1 create pos_database

# Update wrangler.toml with your database_id from the output above
```

### Schema Migration

**Local development:**
```bash
npx wrangler d1 execute pos_database --local --file=./schema.sql
```

**Production:**
```bash
npx wrangler d1 execute pos_database --remote --file=./schema.sql
```

Alternatively, use the migration script:
```bash
node scripts/migrate.js --local   # Local
node scripts/migrate.js --remote  # Production
```

### Running Locally

Start the frontend and backend servers:

```bash
# Terminal 1: Frontend dev server
npm run dev
# Runs on http://localhost:5173

# Terminal 2: Backend API server
npm run dev:backend
# Runs on http://localhost:8788
```

**Default credentials:**
- Username: `admin`
- Password: `admin123`

Complete the setup wizard on first login to configure your business.

---

## Deployment

**One-command deployment:**
```bash
npm run pages:deploy
```

**Full deployment with migrations:**
```bash
./deployment.sh
```

The deployment script handles version bumping, database migrations, and Cloudflare Pages deployment automatically.

---

## Project Structure

```
web-pos/
├── functions/          # Serverless API (Cloudflare Pages Functions)
│   └── api/           # RESTful endpoints
├── src/               # Vue 3 frontend
│   ├── components/    # Reusable UI components
│   ├── views/         # Application pages
│   ├── stores/        # Pinia state management
│   └── utils/         # Helper functions
├── drizzle/           # Database schema and migrations
├── public/            # Static assets and PWA manifest
└── schema.sql         # Database schema
```

---

## Contributing

Contributions are welcome. Please follow this workflow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to your fork (`git push origin feature/your-feature`)
5. Open a Pull Request

**Priority areas:**
- Multi-store support
- Advanced analytics and reporting
- Hardware integrations (receipt printers, cash drawers)
- Localization and multi-language support

---

## Sponsorship

CloudPOS is open-source and actively maintained. Sponsorship enables:

- Enterprise feature development
- Documentation improvements
- Security audits
- Extended platform support

To discuss sponsorship opportunities, open an issue or contact the maintainers directly.

---

## License

MIT License — free for personal and commercial use.

---

**Repository:** [github.com/Mfuon2/web-pos](https://github.com/Mfuon2/web-pos)
