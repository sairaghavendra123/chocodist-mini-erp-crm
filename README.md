# 🍫 ChocoDist — Chocolate Wholesale & Distribution Operations Portal (Mini ERP-CRM)

[![Live App on Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://chocodist-mini-erp-crm.vercel.app)
[![API Server on Render](https://img.shields.io/badge/Render-Backend%20Live-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://chocodist-backend.onrender.com/api/health)
[![Database on Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech)

ChocoDist is an internal enterprise-grade **B2B Wholesale & Distribution Operations Portal** designed for commercial chocolate manufacturers, regional distributors, and wholesale suppliers. It unifies Customer Relationship Management (CRM), Product Catalog Management, Inventory Inward Stock Receiving & Adjustments, Sales Challan Creation, PDF Invoice Generation, and Role-Scoped Real-Time Notifications into a single interface.

---

## 📌 Submission Quick Links

- **GitHub Repository**: [https://github.com/sairaghavendra123/chocodist-mini-erp-crm](https://github.com/sairaghavendra123/chocodist-mini-erp-crm)
- **Live Frontend**: [https://chocodist-mini-erp-crm.vercel.app](https://chocodist-mini-erp-crm.vercel.app)
- **Live Backend API**: [https://chocodist-backend.onrender.com](https://chocodist-backend.onrender.com)
- **Submission Master Document**: [`docs/SUBMISSION.md`](docs/SUBMISSION.md)
- **API Documentation**: [`docs/API.md`](docs/API.md)
- **Architecture Guide**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Known Limitations**: [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md)

---

## 🎯 1. Project Overview

ChocoDist streamlines commercial B2B wholesale distribution workflows. It replaces error-prone spreadsheet tracking with real-time stock allocation, automated low-stock alerts, customer follow-up scheduling, sales challan dispatches, and audit logs.

---

## ✨ 2. Main Features

- **Role-Based Authentication**: JWT-secured login with 1-click demo login buttons.
- **Dynamic Authenticated User Profile**: Top header user initials avatar, role badge, popover dropdown, and full employee details modal (`GET /api/auth/me`).
- **Customer CRM Module**: Add and view B2B customers, duplicate mobile check, status badges (`ACTIVE`, `LEAD`, `INACTIVE`), customer types (`WHOLESALE`, `RETAIL`, `DISTRIBUTOR`), and follow-up notes.
- **Inventory & Stock Management**:
  - `+ Receive Stock` inward inventory shipment receiving.
  - `Stock Adjustment` for damaged, expired, or count correction audits.
  - Atomic Prisma transactions (`prisma.$transaction`) guaranteeing negative stock prevention (`HTTP 400 Bad Request`).
  - Audit logs recording timestamp, user name, role, quantity, and reason.
- **Sales Challans & Dispatch**:
  - Create and confirm sales challans with automatic line-item price & quantity calculations.
  - Stock allocation on confirmation.
  - **PDF Invoice Export**: Client-side PDF generator (`jspdf` + `jspdf-autotable`).
- **Role-Scoped Real-Time Notifications**:
  - Unread badge counter, popover panel, mark as read, and actionable module navigation.
  - Automated event triggers on Customer Creation, Sales Challan Creation/Confirmation, Stock Receiving, Stock Adjustments, and Low Stock Alerts.

---

## 🔐 3. User Roles & Permissions

| System Role | Permitted Actions | Access Limitations |
| :--- | :--- | :--- |
| **ADMIN** | Full system access to all modules, users, catalog, stock, challans, and settings. | None |
| **SALES** | Manage Customer CRM, View Product Availability (Read-Only), Create & Confirm Sales Challans. | Catalog Edit, Stock Inward/Adjustments |
| **WAREHOUSE** | Manage Products Catalog, Receive Inward Stock, Stock Adjustments, View Audit Logs. | Add/Edit Customers, Create Sales Challans |
| **ACCOUNTS** | View Customers & Sales Challans (Read-Only), Export PDF Invoices, View Billing Metrics. | Product Edit, Stock Inward/Adjustments |

---

## 💻 4. Technology Stack

- **Frontend**: React v18.3.1, Vite v5.4.21, TypeScript v5.6.3, Vanilla CSS Custom Design System, Lucide React icons, jsPDF + Autotable.
- **Backend**: Node.js v22+, Express v4.21.1, TypeScript v5.6.3 (Node16 resolution), Prisma ORM v5.22.0, Zod v3.23.8 validation, JWT authentication (`jsonwebtoken` v9), `bcryptjs`.
- **Database**: Neon Cloud PostgreSQL.
- **Deployment**: Vercel (Frontend), Render (Backend Web Service), Neon (Database).

---

## 📂 5. Project Structure

```
mini-erp-crm/
├── docs/                         # Submission & Technical Documentation
│   ├── API.md                    # REST API Endpoint Documentation
│   ├── ARCHITECTURE.md           # System Architecture & Topology
│   ├── LIMITATIONS.md            # Technical Limitations & Scope
│   └── SUBMISSION.md             # Submission Deliverables Summary
├── postman/
│   └── ChocoDist-ERP-CRM.postman_collection.json  # Exported Postman API collection
├── backend/                      # Express TypeScript Backend API
│   ├── render.yaml               # Render service configuration
│   ├── package.json              # Backend dependencies & scripts
│   ├── prisma/
│   │   └── schema.prisma         # Prisma ORM Database Schema
│   └── src/
│       ├── middleware/           # Auth JWT & Role guards, Error handling
│       ├── routes/               # REST API route handlers
│       └── index.ts              # Express server entrypoint
└── frontend/                     # React Vite TypeScript Frontend
    ├── vercel.json               # Vercel SPA proxy routing configuration
    ├── package.json              # Frontend dependencies
    └── src/
        ├── components/           # Sidebar, TopBar, Modal UI components
        ├── context/              # AuthContext session state management
        ├── pages/                # Dashboard, Customers, Products, Inventory, Challans, Login
        └── services/             # fetchApi REST client
```

---

## 🏗 6. Architecture

```
[ User ]
   │
   ▼
[ Vercel React/Vite Frontend ] (https://chocodist-mini-erp-crm.vercel.app)
   │
   │ HTTPS / REST API (JSON)
   ▼
[ Render Express Backend API ] (https://chocodist-backend.onrender.com)
   │
   │ Prisma ORM Connection Pool (SSL)
   ▼
[ Neon PostgreSQL Database ] (AWS Managed Cloud DB)
```

---

## ⚙️ 7. Local Setup & Installation

1. **Clone Repository**:
   ```bash
   git clone https://github.com/sairaghavendra123/chocodist-mini-erp-crm.git
   cd chocodist-mini-erp-crm
   ```

2. **Install Dependencies**:
   ```bash
   # Install Backend Dependencies
   cd backend && npm install

   # Install Frontend Dependencies
   cd ../frontend && npm install
   ```

3. **Start Backend API**:
   ```bash
   cd backend && npm run dev
   # Backend running at http://localhost:5001
   ```

4. **Start Frontend App**:
   ```bash
   cd frontend && npm run dev
   # Frontend running at http://127.0.0.1:5173/
   ```

---

## 🌐 8. Environment Variables

### Backend (`backend/.env`):
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://neondb_owner:<password>@ep-misty-bread-zarwnmgp-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="<your-secure-jwt-secret>"
FRONTEND_URL="https://chocodist-mini-erp-crm.vercel.app"
```

### Frontend (`frontend/.env`):
```env
VITE_API_URL="https://chocodist-backend.onrender.com/api"
```

---

## 🚀 9. Deployment Topology

- **Frontend**: Vercel (`https://chocodist-mini-erp-crm.vercel.app`)
- **Backend API**: Render (`https://chocodist-backend.onrender.com`)
- **Database**: Neon PostgreSQL (`ep-misty-bread-zarwnmgp-pooler.c-2.eu-west-2.aws.neon.tech`)

---

## 🔑 10. Demo Credentials

| Role | Email | Password | Employee Name |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@chocodist.com` | `ChocoAdmin#2026!A7` | Sai Raghavendra |
| **SALES** | `sales@chocodist.com` | `ChocoSales#2026!B8` | Chandu |
| **WAREHOUSE** | `warehouse@chocodist.com` | `ChocoWarehouse#2026!C9` | Sesha Sai |
| **ACCOUNTS** | `accounts@chocodist.com` | `ChocoAccounts#2026!D4` | Mukesh Raju |

---

## 📡 11. API Documentation

Detailed route documentation is available in [`docs/API.md`](docs/API.md).
Postman collection is located at [`postman/ChocoDist-ERP-CRM.postman_collection.json`](postman/ChocoDist-ERP-CRM.postman_collection.json).

---

## 📝 12. Known Limitations

Technical scope & limitations are documented in [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md).
