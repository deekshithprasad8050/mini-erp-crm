# Mini ERP + CRM Operations Portal

## 🚀 Project Overview

The Mini ERP + CRM Operations Portal is a comprehensive full-stack application designed to manage core business operations, including customer relationship management (CRM), inventory tracking, and sales order (challan) processing. Built with modern web technologies, it features robust role-based access control (RBAC) to securely segregate duties among different operational teams.

## ✨ Features

- **Robust Role-Based Access Control (RBAC):** Four distinct roles (Admin, Sales, Warehouse, Accounts) with strict permission boundaries.
- **Customer Management (CRM):** Track leads, active customers, and customer follow-up history.
- **Inventory Management:** Product catalog, real-time stock tracking, and atomic stock movements (In/Out).
- **Sales Challans (Order Processing):** Create draft orders, confirm them to automatically deduct stock, or cancel them.
- **Auto-generated Identifiers:** Seamlessly auto-generating formatted identifiers like `CH-YYYY-NNNNNN` for challans.
- **Analytics Dashboard:** Real-time statistics and insights.
- **Secure Authentication:** JWT-based authentication with bcrypt password hashing.

## 🏗️ Architecture

```mermaid
graph TD
    Client[React + Vite Frontend]
    API[Express.js Backend API]
    DB[(PostgreSQL Database)]
    
    Client -- HTTP/REST --> API
    API -- Prisma ORM --> DB
    
    subgraph Backend
        Router[Routes] --> Controllers
        Controllers --> Services
        Services --> DB
    end
```

## 🛠️ Tech Stack

**Frontend:**
- React (TypeScript)
- Vite
- Context API (Auth state)

**Backend:**
- Node.js (TypeScript)
- Express.js
- Prisma ORM
- JSON Web Tokens (JWT) for Authentication
- bcrypt for password hashing

**Database:**
- PostgreSQL

## 📂 Folder Structure

```text
mini-erp-crm/
├── backend/
│   ├── prisma/             # Database schema (schema.prisma) and seed data
│   └── src/
│       ├── config/         # App configuration & DB connection
│       ├── middleware/     # Auth, error handling, validation
│       ├── modules/        # Domain-driven feature modules (auth, customers, etc.)
│       ├── routes/         # API router configuration
│       ├── types/          # TypeScript type definitions
│       ├── utils/          # Helper functions (e.g., response formatting, challan generator)
│       ├── app.ts          # Express app setup
│       └── server.ts       # Server entry point
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI & Layout components
│       ├── context/        # React Context (AuthContext)
│       ├── hooks/          # Custom React hooks (useAuth)
│       ├── pages/          # Page views (Dashboard, Login, Customers, etc.)
│       ├── routes/         # Protected route configurations
│       ├── services/       # API integration
│       ├── types/          # Frontend interfaces and types
│       ├── utils/          # Formatting helpers
│       ├── App.tsx         # Main application component
│       └── main.tsx        # React DOM entry point
├── postman/              # Postman collection
├── docker-compose.yml
├── README.md
└── .gitignore
```

## 🗄️ Database Schema & Models

**Key Entities:**
- `User`: Application users with distinct `Role` (ADMIN, SALES, WAREHOUSE, ACCOUNTS).
- `Customer`: Client details with `CustomerType` (RETAIL, WHOLESALE, DISTRIBUTOR) and `CustomerStatus` (LEAD, ACTIVE, INACTIVE).
- `CustomerFollowUp`: Log of interactions with a customer.
- `Product`: Inventory items tracking SKU, current price, and current stock level.
- `StockMovement`: History of inventory changes with `MovementType` (IN, OUT).
- `SalesChallan`: Sales orders with `ChallanStatus` (DRAFT, CONFIRMED, CANCELLED).
- `SalesChallanItem`: Snapshot of products added to a challan at the time of creation (maintains price/SKU history).

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
# Database Connection String
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/mini_erp_crm

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this

# Server Configuration
PORT=5000

# CORS Setting
FRONTEND_URL=http://localhost:5173
```

## 🚀 Installation & Setup

1. **Database Setup (PostgreSQL):**
   Ensure PostgreSQL is running locally or via Docker:
   ```bash
   docker-compose up postgres -d
   ```
   *(Alternatively, use a hosted provider like Neon or Supabase)*

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   
   # Run Prisma Migrations
   npx prisma migrate dev --name init
   
   # Seed the database with initial data and test users
   npx prisma db seed
   
   # Start the development server
   npm run dev
   ```
   The backend will start on `http://localhost:5000`

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   
   # Start the development server
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

## 🧪 Test Credentials

All test accounts use the password: `Password123!`

- **Admin:** `admin@example.com`
- **Sales:** `sales@example.com`
- **Warehouse:** `warehouse@example.com`
- **Accounts:** `accounts@example.com`

## 🔐 Role Permissions

| Role | Permissions |
| :--- | :--- |
| **ADMIN** | Full access to all modules and system configurations. |
| **SALES** | Manage customers, follow-ups, and challans (create/edit). View products. |
| **WAREHOUSE** | Manage products, record stock movements. View challans. |
| **ACCOUNTS** | View customers. View confirmed challans. |

## 📐 Critical Business Rules

1. **Negative Stock Prevention:** Stock levels can never drop below zero. Any `OUT` movement that exceeds current inventory is instantly rejected.
2. **Draft Challans:** Saving a challan as `DRAFT` does **not** impact stock levels.
3. **Atomic Confirmations:** Confirming a challan triggers an atomic database transaction. It either deducts all required stock successfully, or rolls back entirely if any single product has insufficient stock.
4. **Historical Pricing:** Challan items store a immutable snapshot of the product details (name, SKU, price) at the time of order creation, protecting historical invoices from future product price updates.
5. **Standardized Identifiers:** Challan numbers are auto-generated sequentially following the format `CH-YYYY-NNNNNN`.

## 🌐 API Documentation

All secured endpoints require the `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/auth` - Login to receive JWT
  - **Req:** `{ "email": "...", "password": "..." }`
  - **Res:** `{ "token": "...", "user": { ... } }`
- `GET /api/auth/me` - Get current user profile (Requires Auth)

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create a new customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (if no linked records)

### Customer Follow-Ups
- `GET /api/customers/:id/followups` - List follow-ups for a customer
- `POST /api/customers/:id/followups` - Add a new follow-up note

### Products & Inventory
- `GET /api/products` - List products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product details
- `POST /api/products/:id/stock` - Add stock movement (IN/OUT)
  - **Req:** `{ "movementType": "IN", "quantityChanged": 50, "reason": "Purchase Order PO-123" }`
- `GET /api/products/:id/stock-movements` - View movement history

### Sales Challans
- `GET /api/challans` - List sales challans
- `POST /api/challans` - Create a new draft challan
  - **Req:** `{ "customerId": "<uuid>", "items": [{ "productId": "<uuid>", "quantity": 5 }] }`
- `GET /api/challans/:id` - Get challan details
- `PUT /api/challans/:id` - Update a draft challan
- `POST /api/challans/:id/confirm` - Confirm a challan (deducts stock)
- `POST /api/challans/:id/cancel` - Cancel a challan

### Dashboard
- `GET /api/dashboard/stats` - Get summary statistics for the dashboard view

## 🌍 Deployment

- **Frontend (Vercel):** Connect your GitHub repository to Vercel. Set the build command to `npm run build` and output directory to `dist`. Ensure you set the `VITE_API_URL` environment variable to your deployed backend URL.
- **Backend (Render / Railway):** Deploy the Express application. Ensure the start command is `npm start` (or `node dist/server.js` after a build step). Set all environment variables securely.
- **Database (Neon / Supabase):** Create a managed PostgreSQL database. Provide the connection string to the Backend's `DATABASE_URL` environment variable. Remember to run `npx prisma migrate deploy` during your backend deployment pipeline.

## ⚠️ Known Limitations
- Deletion of customers or products that have associated historical data (like challans or stock movements) is prevented by foreign key constraints to preserve data integrity.
- File attachments for customer follow-ups are not yet supported.
