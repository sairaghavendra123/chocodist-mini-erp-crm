# 📡 ChocoDist Mini ERP-CRM — REST API Documentation

This document outlines the complete REST API endpoints provided by the ChocoDist Express backend. All requests return standard JSON responses:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

---

## 🔑 Authentication Headers

All protected endpoints require a JSON Web Token (JWT) supplied in the HTTP Authorization header:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 1. Authentication Endpoints (`/api/auth`)

### 1.1 User Login
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "email": "admin@chocodist.com",
    "password": "ChocoAdmin#2026!A7"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1...",
      "user": {
        "id": "4aec555e-7386-4fcf-b4e0-ab7ae618a7df",
        "name": "Sai Raghavendra",
        "email": "admin@chocodist.com",
        "role": "ADMIN",
        "employeeId": "EMP-ADM-001",
        "department": "Executive Management",
        "jobTitle": "Operations Director",
        "status": "ACTIVE"
      }
    }
  }
  ```

### 1.2 Get Authenticated Profile
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "4aec555e-7386-4fcf-b4e0-ab7ae618a7df",
      "name": "Sai Raghavendra",
      "email": "admin@chocodist.com",
      "role": "ADMIN",
      "employeeId": "EMP-ADM-001",
      "department": "Executive Management",
      "mobile": "+91 98765 43210"
    }
  }
  ```

---

## 📊 2. Dashboard Endpoints (`/api/dashboard`)

### 2.1 Get Summary Metrics & Recent Activity
- **Method**: `GET`
- **Endpoint**: `/api/dashboard/stats`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: All (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalCustomers": 12,
      "totalProducts": 18,
      "lowStockCount": 3,
      "totalChallans": 8,
      "recentChallans": [ ... ],
      "lowStockProducts": [ ... ]
    }
  }
  ```

---

## 👥 3. Customer CRM Endpoints (`/api/customers`)

### 3.1 List & Search Customers
- **Method**: `GET`
- **Endpoint**: `/api/customers`
- **Query Parameters**:
  - `q` (optional): Search term (name, business name, mobile, GST)
  - `status` (optional): `ACTIVE` | `LEAD` | `INACTIVE`
  - `customerType` (optional): `WHOLESALE` | `RETAIL` | `DISTRIBUTOR`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: `ADMIN`, `SALES`, `ACCOUNTS`

### 3.2 Add Customer
- **Method**: `POST`
- **Endpoint**: `/api/customers`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: `ADMIN`, `SALES`
- **Request Body**:
  ```json
  {
    "name": "Rajesh Kumar",
    "businessName": "Sweet Delights Wholesale",
    "mobile": "+91 98123 45678",
    "email": "rajesh@sweetdelights.com",
    "gstNumber": "36AAAAA0000A1Z5",
    "customerType": "WHOLESALE",
    "address": "45 Market Road, Commercial Hub",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500001",
    "status": "ACTIVE"
  }
  ```

---

## 📦 4. Products Catalog Endpoints (`/api/products`)

### 4.1 List Products
- **Method**: `GET`
- **Endpoint**: `/api/products`
- **Query Parameters**: `q`, `category`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: All roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`)

### 4.2 Add Product
- **Method**: `POST`
- **Endpoint**: `/api/products`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: `ADMIN`, `WAREHOUSE`
- **Request Body**:
  ```json
  {
    "sku": "CHOC-BLK-70",
    "name": "Dark Chocolate 70% Cocoa Block 1kg",
    "category": "Dark Chocolate",
    "unitPrice": 650.00,
    "currentStock": 150,
    "minStockAlert": 30,
    "description": "Premium 70% Dark Couverture Block"
  }
  ```

---

## 🏗 5. Inventory & Stock Audit Endpoints (`/api/inventory`)

### 5.1 Fetch Audit Log
- **Method**: `GET`
- **Endpoint**: `/api/inventory/movements`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: All roles

### 5.2 Stock Inward Receipt & Adjustment
- **Method**: `POST`
- **Endpoint**: `/api/inventory/adjust`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: `ADMIN`, `WAREHOUSE`
- **Request Body**:
  ```json
  {
    "productId": "prod_123456",
    "type": "STOCK_IN",
    "quantity": 50,
    "reason": "Stock Replenishment Supplier Delivery",
    "notes": "PO-2026-8891 Received Batch #88"
  }
  ```

---

## 📄 6. Sales Challans Endpoints (`/api/challans`)

### 6.1 List Sales Challans
- **Method**: `GET`
- **Endpoint**: `/api/challans`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: `ADMIN`, `SALES`, `ACCOUNTS`

### 6.2 Create Sales Challan
- **Method**: `POST`
- **Endpoint**: `/api/challans`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: `ADMIN`, `SALES`
- **Request Body**:
  ```json
  {
    "customerId": "cust_123456",
    "notes": "Urgent wholesale dispatch",
    "items": [
      {
        "productId": "prod_123456",
        "quantity": 10
      }
    ]
  }
  ```

### 6.3 Confirm Sales Challan & Allocate Inventory
- **Method**: `PUT`
- **Endpoint**: `/api/challans/:id/confirm`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Allowed Roles**: `ADMIN`, `SALES`

---

## 🔔 7. Notifications Endpoints (`/api/notifications`)

### 7.1 List User Notifications
- **Method**: `GET`
- **Endpoint**: `/api/notifications`
- **Authentication**: `Bearer <JWT_TOKEN>`

### 7.2 Get Unread Badge Count
- **Method**: `GET`
- **Endpoint**: `/api/notifications/unread-count`
- **Authentication**: `Bearer <JWT_TOKEN>`

### 7.3 Mark All Read
- **Method**: `PATCH`
- **Endpoint**: `/api/notifications/read-all`
- **Authentication**: `Bearer <JWT_TOKEN>`
