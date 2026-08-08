# 🍫 ChocoDist — Chocolate Wholesale & Distribution Operations Portal (Mini ERP + CRM)

ChocoDist is an internal enterprise-grade **B2B Wholesale & Distribution Operations Portal** built for chocolate manufacturers, regional distributors, and wholesale suppliers. It unifies Customer Relationship Management (CRM), Product Catalog Management, Inventory Stock Receiving & Adjustment Audits, Sales Challan Creation, PDF Invoice Export, and Role-Scoped Real-Time Notifications into a single interface.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Business Context](#-business-context)
3. [Key Features](#-key-features)
4. [User Roles & Permissions](#-user-roles--permissions)
5. [Technology Stack](#-technology-stack)
6. [Architecture & Deployment Topology](#-architecture--deployment-topology)
7. [Project Directory Structure](#-project-directory-structure)
8. [Mini ERD Explanation](#-mini-erd-explanation)
9. [Local Setup & Installation](#-local-setup--installation)
10. [Environment Variables](#-environment-variables)
11. [Database Setup & Seeding](#-database-setup--seeding)
12. [Running the Backend API](#-running-the-backend-api)
13. [Running the Frontend Application](#-running-the-frontend-application)
14. [API Documentation Overview](#-api-documentation-overview)
15. [Postman Collection Instructions](#-postman-collection-instructions)
16. [Deployment Instructions](#-deployment-instructions)
    - [Neon PostgreSQL Setup](#1-neon-postgresql-setup)
    - [Render Backend Deployment](#2-render-backend-deployment)
    - [Vercel Frontend Deployment](#3-vercel-frontend-deployment)
17. [Assumptions](#-assumptions)
18. [Automated & Manual Testing](#-automated--manual-testing)
19. [Deployed Service URLs](#-deployed-service-urls)

---

## 🎯 Project Overview
ChocoDist streamlines commercial B2B wholesale workflows for chocolate products. It eliminates manual spreadsheet tracking by automating order fulfillment, stock audits, dispatch document creation, customer follow-up scheduling, and role-scoped operational notifications.

---

## 🏢 Business Context
Wholesale chocolate distribution requires strict temperature monitoring, stock expiry tracking, negative inventory prevention, and multi-tier role authorization. Sales representatives create dispatch challans, warehouse personnel perform inward stock receipts and adjustments, accountants manage billing, and executive management monitors real-time sales and low-stock alerts.

---

## ✨ Key Features
- **Enterprise 50/50 Split Login**: Secure JWT login with 1-click role quick login buttons.
- **Dynamic TopBar & User Profile**: Displays user initials avatar, role badge, popover dropdown, and detailed profile modal (`GET /api/auth/me`).
- **Customer CRM Module**: Add/view B2B customers, duplicate mobile check, status badges (`ACTIVE`, `LEAD`, `INACTIVE`), and follow-up tracking.
- **Inventory & Stock Management**:
  - `+ Receive Stock` modal for inward inventory shipments.
  - `Stock Adjustment` modal for damaged, expired, or count correction adjustments.
  - Atomic Prisma transactions (`prisma.$transaction`) ensuring negative stock prevention (`HTTP 400 Bad Request`).
  - Real-time `StockMovement` audit logs recording employee ID, timestamp, quantity, and reason.
- **Sales Challans & Dispatch**:
  - Create and confirm sales challans with automatic line-item total calculations.
  - Stock allocation on confirmation.
  - **PDF Invoice Export**: Client-side PDF generator using `jspdf` and `jspdf-autotable`.
- **Role-Scoped Notifications**:
  - Real-time unread badge counter, popover panel, mark as read, and actionable navigation to relevant modules.
  - Automated event triggers on Customer Creation, Sales Challan Creation/Confirmation, Stock Receiving, Stock Adjustments, and Low Stock Alerts.

---

## 🔐 User Roles & Permissions

| Role | Permitted Actions | Restricted Modules |
| :--- | :--- | :--- |
| **ADMIN** | Full system access to all modules, users, stock, challans, and settings. | None |
| **SALES** | Manage Customers CRM, View Product Availability (Read-Only), Create & Confirm Sales Challans. | Products Catalog Edit, Receive Stock, Stock Adjustments |
| **WAREHOUSE** | Manage Products Catalog, Receive Inward Stock, Stock Adjustments, View Audit Logs. | Add/Edit Customers, Create Sales Challans |
| **ACCOUNTS** | View Customers & Sales Challans (Read-Only), Export PDF Invoices, View Billing Metrics. | Product Edit, Stock Inward/Adjustment |

---

## 💻 Technology Stack
- **Frontend**: React v18.3.1, Vite v5.4.11, TypeScript v5.6.3, Vanilla CSS Custom Design System, Lucide React icons, jsPDF + Autotable.
- **Backend**: Node.js v22+, Express v4.21.1, TypeScript v5.6.3, Prisma ORM v5.22.0, Zod v3.23.8 request validation, JWT authentication (`jsonwebtoken` v9), `bcryptjs`.
- **Database**: SQLite (Local execution), Neon PostgreSQL (Production deployment).
- **Deployment**: Vercel (Frontend), Render (Backend Web Service), Neon (Cloud PostgreSQL).

---

## 🏗 Architecture & Deployment Topology

```
[ Vercel Frontend ] ──(HTTPS / REST API)──> [ Render Backend API ] ──(Prisma Connection Pool)──> [ Neon PostgreSQL ]
```

---

## 📂 Project Directory Structure

```
mini-erp-crm/
├── .env.example                  # Root environment template
├── .gitignore                    # Git ignore file
├── README.md                     # Comprehensive documentation
├── backend/                      # Express TypeScript Backend API
│   ├── .env.example              # Backend environment template
│   ├── render.yaml               # Render service configuration
│   ├── package.json              # Backend dependencies & scripts
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma ORM Database Schema
│   │   ├── dev.db                # SQLite Local Database File
│   │   └── seed.ts               # Database Seed Script
│   └── src/
│       ├── config/               # Database connection instance
│       ├── middleware/           # Auth JWT & Role guards, Error handling
│       ├── routes/               # REST API route handlers
│       └── index.ts              # Express application server entrypoint
├── frontend/                     # React Vite TypeScript Frontend
│   ├── .env.example              # Frontend environment template
│   ├── vercel.json               # Vercel SPA routing configuration
│   ├── vite.config.ts            # Vite dev server & proxy settings
│   ├── package.json              # Frontend dependencies
│   └── src/
│       ├── components/           # Sidebar, TopBar, Modal UI components
│       ├── context/              # AuthContext session state management
│       ├── pages/                # Dashboard, Customers, Products, Inventory, Challans, Login
│       ├── services/             # fetchApi REST client
│       ├── types/                # TypeScript interface declarations
│       └── index.css             # Vanilla CSS design system
└── postman/
    └── ChocoDist-ERP-CRM.postman_collection.json  # Exported Postman API collection
```

---

## 🗄 Mini ERD Explanation

```
+---------------+        1:N        +------------------+
|     User      | ----------------> |     Customer     |
+---------------+                   +------------------+
  |           |                       |
  | 1:N       | 1:N                   | 1:N
  v           v                       v
+---------------+                   +------------------+
| StockMovement |                   |     Challan      |
+---------------+                   +------------------+
  |                                   |
  | N:1                               | 1:N
  v                                   v
+---------------+        1:N        +------------------+
|    Product    | ----------------> |   ChallanItem    |
+---------------+                   +------------------+
```

1. **User**: Represents system employees (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`). Relates to created Customers, Stock Movements, Sales Challans, and Notifications.
2. **Customer**: B2B buyers (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`). Has many Sales Challans.
3. **Product**: Wholesale chocolate items (`unitPrice`, `currentStock`, `minStockAlert`).
4. **StockMovement**: Inward (`IN`) and Outward (`OUT`) inventory audit records.
5. **Challan**: Dispatch delivery orders (`DRAFT`, `CONFIRMED`, `CANCELLED`).
6. **ChallanItem**: Line items snapshots attached to a Challan.
7. **Notification**: Role-scoped notifications.

---

## ⚙️ Local Setup & Installation

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-username/chocodist-mini-erp-crm.git
   cd chocodist-mini-erp-crm
   ```

2. **Install Dependencies**:
   ```bash
   # Install Backend Dependencies
   cd backend && npm install

   # Install Frontend Dependencies
   cd ../frontend && npm install
   ```

---

## 🌐 Environment Variables

### Backend Environment Variables (`backend/.env`):
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="mini_erp_crm_super_secret_jwt_key_2026"
FRONTEND_URL="http://localhost:5173"
```

### Frontend Environment Variables (`frontend/.env`):
```env
VITE_API_BASE_URL="/api"
```

---

## 🗃 Database Setup & Seeding

```bash
cd backend
npx prisma db push
npm run seed
```

### Demo Accounts Credentials:

| Role | Email | Password | Employee Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@chocodist.com` | `ChocoAdmin#2026!A7` | Sai Raghavendra |
| **Sales** | `sales@chocodist.com` | `ChocoSales#2026!B8` | Chandu |
| **Warehouse** | `warehouse@chocodist.com` | `ChocoWarehouse#2026!C9` | Sesha Sai |
| **Accounts** | `accounts@chocodist.com` | `ChocoAccounts#2026!D4` | Mukesh Raju |

---

## 🚀 Running the Backend API
```bash
cd backend
npm run dev
# Server running at http://localhost:5001
```

---

## 💻 Running the Frontend Application
```bash
cd frontend
npm run dev
# Frontend running at http://127.0.0.1:5173/
```

---

## 📡 API Documentation Overview

### Authentication Routes (`/api/auth`)
- `POST /api/auth/login` — Authenticate user and return JWT token.
- `GET /api/auth/me` — Fetch authenticated user profile.

### Customer CRM Routes (`/api/customers`)
- `GET /api/customers` — List customers.
- `POST /api/customers` — Register new customer.

### Inventory Routes (`/api/inventory`)
- `GET /api/inventory/movements` — Fetch stock movement audit trail.
- `POST /api/inventory/adjust` — Inward Receive / Adjust stock.

### Sales Challan Routes (`/api/challans`)
- `GET /api/challans` — List sales challans.
- `POST /api/challans` — Create sales challan.
- `PUT /api/challans/:id/confirm` — Confirm challan & dispatch stock.

### Notification Routes (`/api/notifications`)
- `GET /api/notifications` — Fetch user notifications.
- `GET /api/notifications/unread-count` — Fetch unread badge count.
- `PATCH /api/notifications/read-all` — Mark all notifications as read.

---

## 📮 Postman Collection Instructions

1. Open Postman.
2. Click **Import** and select `postman/ChocoDist-ERP-CRM.postman_collection.json`.
3. Set the `BASE_URL` collection variable to `http://localhost:5001/api` (or your Render URL).
4. Run the **Login (Admin)** request to receive a token, then copy it into the `AUTH_TOKEN` variable.

---

## ☁️ Deployment Instructions

### 1. Neon PostgreSQL Setup
1. Log into [Neon.tech](https://neon.tech/) and create a new PostgreSQL database instance named `chocodist-db`.
2. Copy the Connection String URL (`postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`).
3. In `backend/prisma/schema.prisma`, update the datasource block:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run Prisma database sync and seed script:
   ```bash
   npx prisma db push
   npm run seed
   ```

### 2. Render Backend Deployment
1. Log into [Render.com](https://render.com/) and click **New + ➔ Web Service**.
2. Connect your GitHub repository and select the `backend/` directory.
3. Configure settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
   - `DATABASE_URL`: `<Your Neon PostgreSQL Connection String>`
   - `JWT_SECRET`: `<Secure Random String>`
   - `FRONTEND_URL`: `https://your-app.vercel.app`

### 3. Vercel Frontend Deployment
1. Log into [Vercel.com](https://vercel.com/) and click **Add New Project**.
2. Connect your GitHub repository and select the `frontend/` directory.
3. Framework Preset: **Vite**.
4. Configure Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-render-backend.onrender.com/api`
5. Click **Deploy**.

---

## 📝 Assumptions
1. Operating system supports Node.js v18+.
2. Local database defaults to SQLite for instant local execution.
3. JWT tokens expire after 24 hours.

---

## 🧪 Automated & Manual Testing

### Execute Production Builds:
```bash
# Verify Backend TypeScript Build
cd backend && npm run build

# Verify Frontend Production Build
cd frontend && npm run build
```

---

## 🔗 Deployed Service URLs

- **Frontend Application (Vercel)**: `https://chocodist-erp.vercel.app` *(Placeholder for deployment)*
- **Backend API Server (Render)**: `https://chocodist-backend.onrender.com/api` *(Placeholder for deployment)*
- **Database (Neon PostgreSQL)**: `ep-cool-chocolate-123456.neon.tech` *(Placeholder for deployment)*
