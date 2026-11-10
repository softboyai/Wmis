# WMIS — Warehouse Management Information System
### Africa Global Logistics (AGL) Rwanda

A complete, production-quality warehouse management system built with React, Node.js, and MongoDB.

---

## Quick Start (One Command)

```bash
# 1. Install everything
npm run install:all

# 2. Start MongoDB (if running locally)
# Windows: net start MongoDB
# Mac/Linux: sudo systemctl start mongod

# 3. Set unique seed account passwords in .env, then seed the database
npm run seed

# 4. Start both server and client — browser opens automatically
npm run dev
```

The app opens at **http://localhost:5173** automatically.
The seed command clears existing database records before creating sample data; use it only with a development database.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | admin@aglrwanda.com | `SEED_ADMIN_PASSWORD` in `.env` |
| **Warehouse Manager** | manager@aglrwanda.com | `SEED_MANAGER_PASSWORD` in `.env` |
| **Store Keeper** | storekeeper@aglrwanda.com | `SEED_STOREKEEPER_PASSWORD` in `.env` |

---

## Installation on a New Computer

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| MongoDB | v6+ | https://www.mongodb.com/try/download/community |
| npm | v9+ | (comes with Node.js) |
| Git | any | https://git-scm.com |

### Step-by-step

```bash
# 1. Clone the project
git clone <your-repo-url> wmis
cd wmis

# 2. Copy and edit environment variables
copy .env.example .env
# Edit .env with your MongoDB URI and secrets (see below)

# 3. Install ALL dependencies (root + server + client)
npm run install:all

# 4. Start MongoDB
#   Windows:  net start MongoDB
#   macOS:    brew services start mongodb-community
#   Linux:    sudo systemctl start mongod

# 5. Seed the database
# Set unique SEED_ADMIN_PASSWORD, SEED_MANAGER_PASSWORD, and SEED_STOREKEEPER_PASSWORD values in .env first.
# This clears existing records; only seed a development database.
npm run seed

# 6. Run the app (auto-opens browser)
npm run dev
```

### On a Computer Without Internet (Offline Transfer)

```bash
# On the source machine — pack node_modules
tar -czf wmis-with-modules.tar.gz wmis/

# Transfer the archive to the target machine, then:
tar -xzf wmis-with-modules.tar.gz
cd wmis
npm run seed
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Server port
PORT=5000

# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/wmis_agl
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/wmis_agl

# JWT secrets — change these to random 32+ character strings!
JWT_SECRET=change_me_to_a_random_32_char_string
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=change_me_different_random_32_char_string
REFRESH_TOKEN_EXPIRES_IN=7d

# Unique passwords for sample accounts (at least 8 characters each)
SEED_ADMIN_PASSWORD=replace_with_a_unique_password
SEED_MANAGER_PASSWORD=replace_with_a_unique_password
SEED_STOREKEEPER_PASSWORD=replace_with_a_unique_password

# Your frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=5
```

> **Security note:** Never commit your `.env` file. The `.gitignore` already excludes it.

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both server + client (browser opens automatically) |
| `npm run dev:open` | Same as above, explicitly forces browser open |
| `npm run seed` | Reset and seed the database with demo data |
| `npm run build` | Build the React frontend for production |
| `npm run start` | Start only the server (production mode) |
| `npm run test` | Run all tests (server + client) |
| `npm run install:all` | Install all dependencies (run this first!) |

---

## Customizing Colors and Branding

### Method 1 — Live Drag Color Picker (easiest)

1. Log in to the app
2. Click the **palette button** in the bottom-right corner
3. The Theme Customizer panel opens with:
   - **Organization Name** — change "AGL Rwanda" to your company name
   - **System Title** — change "WMIS v1.0" to anything you like
   - **Accent color presets** — click a circle to switch instantly
   - **Individual color swatches** — drag left/right on a swatch to sweep through hues, or click it to open a full color picker dialog
4. Changes apply instantly and are saved in your browser for next session

### Method 2 — Edit the Tailwind config (permanent, affects all users)

Open `client/tailwind.config.js` and change the color values:

```js
colors: {
  accent: {
    DEFAULT: '#5b6af5',   // ← Change this hex to your brand color
    hover:   '#6e7cf7',   // ← Slightly lighter version for hover
    // ...
  },
  success: { DEFAULT: '#22c55e' },  // green — in-stock
  warning: { DEFAULT: '#f59e0b' },  // amber — low-stock
  danger:  { DEFAULT: '#ef4444' },  // red   — errors / out-of-stock
  info:    { DEFAULT: '#3b82f6' },  // blue  — pending
}
```

Then rebuild: `npm run build`

### Method 3 — Change the company name in source

Edit two files:
- `client/src/layouts/AppLayout.jsx` — find `"AGL Rwanda"` and `"WMIS v1.0"`
- `client/src/pages/LoginPage.jsx` — find `"AGL Rwanda"` and `"Warehouse Management System"`

---

## Project Structure

```
wmis/
├── server/
│   └── src/
│       ├── config/       MongoDB connection
│       ├── models/       Mongoose schemas
│       ├── controllers/  Route handlers
│       ├── routes/       Express routers
│       ├── middleware/   Auth, RBAC, error handler, validator
│       ├── validators/   Zod schemas (server-side)
│       ├── utils/        Helpers, activity logger, pagination
│       ├── app.js        Express app setup
│       ├── server.js     Entry point
│       └── seed.js       Database seeder
├── client/
│   └── src/
│       ├── api/          Axios instance + API calls
│       ├── components/   Reusable UI components
│       │   ├── ui/       Buttons, inputs, table, modal, etc.
│       │   ├── CommandPalette.jsx
│       │   └── ThemeCustomizer.jsx   ← drag color picker
│       ├── hooks/        useAuth, useTheme, useDebounce
│       ├── layouts/      AppLayout (sidebar + topbar)
│       ├── pages/        One file per page
│       ├── lib/          Client-side Zod schemas
│       └── styles/       Tailwind global CSS
├── .env                  Your environment variables (not committed)
├── .env.example          Template for .env
└── README.md
```

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

| Resource | Endpoints |
|----------|-----------|
| Auth | POST /auth/login, POST /auth/logout, GET /auth/me, POST /auth/refresh, PUT /auth/change-password, POST /auth/forgot-password, POST /auth/reset-password |
| Users | GET/POST /users, GET/PUT /users/:id, POST /users/:id/reset-password |
| Products | GET/POST /products, GET/PUT/DELETE /products/:id, GET /products/categories |
| Suppliers | GET/POST /suppliers, GET/PUT/DELETE /suppliers/:id |
| Clients | GET/POST /clients, GET/PUT/DELETE /clients/:id |
| Locations | GET/POST /locations, GET/PUT/DELETE /locations/:id |
| Receipts | GET/POST /receipts, GET /receipts/:id |
| Dispatches | GET/POST /dispatches, GET /dispatches/:id, POST /dispatches/:id/approve, POST /dispatches/:id/reject, POST /dispatches/:id/dispatch |
| Stock | GET /stock, GET /stock/by-location |
| Movements | GET /movements |
| Reports | GET /reports/stock, GET /reports/receipts, GET /reports/dispatches (add ?format=pdf or ?format=csv) |
| Logs | GET /logs |
| Dashboard | GET /dashboard/summary |

All list endpoints support: `?page=1&limit=20&search=term&sort=-createdAt`

---

## Role Permissions

| Feature | Administrator | Warehouse Manager | Store Keeper |
|---------|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ |
| View products | ✓ | ✓ | ✓ |
| Manage products (CRUD) | ✓ | — | — |
| Suppliers / Clients | ✓ | — | — |
| Storage locations | ✓ | — | — |
| Record goods received | ✓ | — | ✓ |
| Create dispatch request | ✓ | — | ✓ |
| Approve / Reject dispatch | ✓ | ✓ | — |
| Mark as Dispatched | ✓ | ✓ | — |
| Stock overview | ✓ | ✓ | ✓ |
| Reports (view + export) | ✓ | ✓ | — |
| Activity logs | ✓ | — | — |
| User management | ✓ | — | — |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `⌘K` | Open command palette |
| `/` | Open command palette |
| `G` then `D` | Go to Dashboard |
| `G` then `P` | Go to Products |
| `Esc` | Close dialogs |
| `?` | Show shortcuts help |

---

## Security Features

- JWT access tokens (15 min) + refresh tokens (7 days, httpOnly cookie)
- bcrypt password hashing (cost factor 12)
- Account lockout after 5 failed login attempts (15 min)
- Rate limiting: 100 req/15 min global, 5 req/15 min on login
- Helmet security headers
- CORS restricted to client origin
- express-mongo-sanitize (NoSQL injection prevention)
- Request body size limit (10 KB)
- Role-based access control on every protected endpoint
- Passwords never returned, logged, or stored in plain text
- Stack traces never exposed in production

---

## Troubleshooting

**MongoDB not connecting**
```bash
# Check if MongoDB is running
# Windows:
net start MongoDB
# Or use MongoDB Compass to verify the URI
```

**Port already in use**
```bash
# Change PORT in .env to 5001, and update CLIENT_URL proxy in vite.config.js
```

**Browser doesn't open automatically**
```bash
# Navigate manually to:
http://localhost:5173
```

**Seed fails with duplicate key error**
```bash
# The seed script clears all data first, so just re-run:
npm run seed
```

---

## Screenshots

> Add screenshots to this section after running the app.

---

*Built for AGL Rwanda · WMIS v1.0*
