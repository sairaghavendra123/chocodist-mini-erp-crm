# 🏗 ChocoDist Mini ERP-CRM — Architecture Documentation

This document explains the technical architecture, deployment topology, data flow, security model, and component responsibilities of the ChocoDist B2B Wholesale ERP + CRM system.

---

## 1. High-Level Architecture Overview

ChocoDist follows a decoupled 3-tier SaaS architecture designed for cloud scalability and low-latency API communication:

```
+-------------------------------------------------------------------+
|                        Client Layer                               |
|   React v18 SPA + Vite + TypeScript (Deployed on Vercel Edge)      |
+-------------------------------------------------------------------+
                                  │
                                  │ HTTPS / REST API / JSON
                                  ▼
+-------------------------------------------------------------------+
|                        Application Layer                          |
|   Node.js + Express + TypeScript + JWT Auth (Deployed on Render)  |
+-------------------------------------------------------------------+
                                  │
                                  │ Prisma ORM Connection Pool (SSL)
                                  ▼
+-------------------------------------------------------------------+
|                         Database Layer                            |
|       Neon PostgreSQL Cloud Managed Database (AWS eu-west-2)     |
+-------------------------------------------------------------------+
```

---

## 2. Frontend Architecture (Vercel)

- **Framework**: React 18 SPA built with Vite and TypeScript.
- **State Management**: React Context (`AuthContext.tsx`) for global user session, JWT token persistence, and role-based guard rules (`canAccess(module)`).
- **Styling**: Vanilla CSS Design System (`index.css`) utilizing CSS custom properties for cohesive chocolate-inspired design tokens (`#3D2314` Espresso, `#5C3A21` Cocoa, `#D48B45` Warm Gold Accent).
- **PDF Generation**: Client-side document compilation using `jspdf` and `jspdf-autotable` for offline dispatch invoice printing.
- **API Client**: Centralized helper (`fetchApi`) with automatic Authorization header injection and 401 unauthenticated redirect handlers.

---

## 3. Backend Architecture (Render)

- **Runtime & Framework**: Node.js with Express and TypeScript compiled under `node16` module resolution.
- **Routing & Controllers**: Modular route handlers (`routes/auth.ts`, `routes/customers.ts`, `routes/products.ts`, `routes/inventory.ts`, `routes/challans.ts`, `routes/dashboard.ts`, `routes/notifications.ts`).
- **Middleware Layer**:
  - `authenticateToken`: Validates incoming JWT `Bearer` tokens.
  - `requireRole`: Enforces RBAC permissions per route.
  - `errorHandler`: Global Express exception handling.
- **Validation**: Zod schema validation ensuring strict input sanitization.

---

## 4. Database Architecture (Neon PostgreSQL)

- **ORM**: Prisma ORM v5.22.0 providing type-safe database queries and automated schema migrations.
- **Transaction Safety**: Atomic database transactions (`prisma.$transaction`) executing stock deductions and movement record creations simultaneously to guarantee zero negative stock levels.
- **Entity Relationships**:
  - `User` ➔ `1:N` ➔ `Customer`, `StockMovement`, `Challan`, `Notification`
  - `Customer` ➔ `1:N` ➔ `Challan`
  - `Challan` ➔ `1:N` ➔ `ChallanItem`
  - `Product` ➔ `1:N` ➔ `StockMovement`, `ChallanItem`

---

## 5. Security & Authentication Model

- **Password Hashing**: `bcryptjs` salted hashing.
- **Session Tokens**: Statetess JWT tokens signed with `JWT_SECRET` expiring in 24 hours.
- **CORS Protection**: Explicit origin whitelisting allowing local development (`http://localhost:5173`) and production frontend domains (`FRONTEND_URL`).
- **Data Protection**: Zero raw database passwords committed to Git.

---

## 6. Role-Based Access Control (RBAC) Matrix

| Module / Feature | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
| :--- | :---: | :---: | :---: | :---: |
| **Executive Dashboard** | Full | Sales Metrics | Stock Metrics | Financials |
| **Customers CRM** | Create / Edit | Create / Edit | - | Read-Only |
| **Products Catalog** | Create / Edit | Read-Only | Create / Edit | Read-Only |
| **Stock Inward & Adjust** | Execute | - | Execute | - |
| **Stock Movement Audit** | Read-Only | Read-Only | Read-Only | Read-Only |
| **Sales Challan Create** | Create / Confirm | Create / Confirm | - | Read-Only / PDF |
| **System Notifications** | Role Scoped | Role Scoped | Role Scoped | Role Scoped |
