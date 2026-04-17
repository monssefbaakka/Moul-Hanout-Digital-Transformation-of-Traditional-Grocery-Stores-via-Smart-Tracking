# Moul Hanout MVP Scope

## 1. Purpose

This document defines the **2-week MVP** for **Moul Hanout - Digital Transformation of Traditional Grocery Stores**.

It describes the exact product scope that is realistic to implement in a short delivery window while keeping the architecture clean and production-oriented.

This MVP is intentionally narrow:

- single store only
- no supplier management
- no purchase management
- no multi-store support
- no advanced reporting

The goal is to deliver a usable first version of the POS system for a traditional grocery store with the minimum set of features required to manage products, stock, and sales.

## 2. MVP Objective

The MVP must allow a small grocery store to:

- authenticate users securely
- manage a basic product catalog
- organize products by category
- track stock manually
- perform sales at checkout
- register cash payments
- generate a simple receipt
- view a small operational dashboard

At the end of the MVP, the store should be able to run daily selling operations with a simple digital workflow instead of paper-based tracking.

## 3. MVP Product Vision

The first version of Moul Hanout is a **simple POS and stock tracking system** for one store.

It is designed for:

- the shop owner or admin
- the cashier

This first version does not try to solve every retail problem. It focuses only on the most important operational flows:

1. log in
2. manage products and categories
3. update stock manually
4. create sales
5. accept cash payment
6. see basic daily indicators

## 4. Users and Roles

The MVP includes only two active roles.

### 4.1 Admin

The Admin can:

- log in
- view users
- manage products
- manage categories
- view stock
- record stock in
- record stock out
- view dashboard

### 4.2 Cashier

The Cashier can:

- log in
- view stock
- create sale
- add items to cart
- process cash payment
- generate receipt

### 4.3 Role Model Decision

To keep the MVP achievable in two weeks:

- roles are fixed in code or seed data
- there is no advanced permission matrix
- there is no dynamic role management UI

## 5. In-Scope Features

### 5.1 Authentication

Included:

- login with email and password
- JWT-based authenticated session
- logout

Constraints:

- no forgot password
- no password reset
- no self-service registration from UI

Notes:

- users may be seeded directly in the database for the MVP
- authentication must still follow secure backend practices

### 5.2 User Access

Included:

- seeded users for Admin and Cashier
- protected API endpoints based on role
- user list endpoint for admin visibility

Constraints:

- no user creation UI
- no user profile management
- no advanced permission assignment

### 5.3 Category Management

Included:

- create category
- list categories
- update category
- deactivate or archive category if needed

Category fields:

- name
- description
- isActive

### 5.4 Product Management

Included:

- create product
- list products
- view product details
- update product
- deactivate product

Product fields:

- name
- barcode
- description
- costPrice
- salePrice
- currentStock
- lowStockThreshold
- expirationDate
- categoryId
- isActive

Rules:

- a product belongs to one category
- stock starts at zero or a specified initial value
- sale price must be greater than or equal to zero
- stock must never become negative through a valid sale
- expiration date is optional only for non-perishable items if you choose that rule in implementation

### 5.5 Inventory Management

Included:

- view current stock
- manual stock in
- manual stock out
- expiration date tracking
- admin alert when a product is 5 days away from expiration
- stock movement history at backend level

Stock movement fields:

- productId
- type: `IN`, `OUT`, `ADJUSTMENT`
- quantity
- reason
- createdBy
- createdAt

Rules:

- stock in increases product quantity
- stock out decreases product quantity
- every completed sale must automatically create stock out updates
- stock out must be blocked if quantity is insufficient
- products close to expiration should remain queryable from backend data
- products 5 days away from expiration must be identifiable for admin alerting
- all stock changes must be traceable

### 5.6 Sales and Checkout

Included:

- create sale
- add one or more items to sale
- calculate line total
- calculate sale total
- validate stock before confirming sale
- persist sale and sale items

Sale fields:

- receiptNumber
- subtotal
- totalAmount
- soldAt
- cashierUserId
- status

Sale item fields:

- productId
- quantity
- unitPrice
- lineTotal

Rules:

- prices are read from product sale price
- no complex tax engine in MVP unless required by your academic scope
- no sale should be finalized if one item is out of stock
- when a sale is completed, product stock must be reduced automatically
- the stock update must happen in the same transaction as sale confirmation

### 5.7 Payment

Included:

- cash payment only
- record payment amount
- mark payment as completed

Payment fields:

- saleId
- amount
- method
- status
- paidAt

Rules:

- payment method is limited to `CASH`
- successful payment finalizes the sale

Excluded:

- card payment
- mobile payment
- mixed payment
- refund handling

### 5.8 Receipt

Included:

- generate a simple sale receipt response after successful payment

Receipt content:

- receipt number
- sale date
- cashier name
- list of sold items
- quantities
- unit prices
- line totals
- grand total
- payment method

The MVP receipt can be:

- JSON response
- printable frontend view

No PDF generation is required for the MVP unless time allows.

### 5.9 Dashboard

Included:

- today sales total
- number of sales today
- low-stock product list
- products nearing expiration date
- admin alert for products expiring within 5 days

Purpose:

- give the admin a quick daily operational summary

Excluded:

- advanced charts
- weekly and monthly analytics
- export
- profitability reports

### 5.10 Audit Logging

Included at backend level:

- record important actions such as product creation, stock update, and sale completion

Excluded:

- dedicated audit log UI
- complex audit search screen

This keeps traceability without increasing frontend scope too much.

## 6. Out-of-Scope Features

The following features are explicitly postponed after the MVP.

### 6.1 Business Features Removed

- supplier management
- purchase orders
- purchase reception
- customer management
- customer loyalty
- promotions
- discount rules
- returns and refunds
- sales cancellation workflow
- barcode printing
- product image upload

### 6.2 Architecture Features Removed

- multi-store support
- store-to-store isolation
- dynamic permission management
- advanced session device management
- background jobs
- notification system

### 6.3 Reporting Features Removed

- advanced reports
- date range analytics
- payment breakdown analytics
- export to PDF or Excel
- comparative dashboards

## 7. Core MVP Workflows

### 7.1 Login Flow

1. User submits email and password.
2. Backend validates credentials.
3. System returns authenticated session tokens.
4. User is redirected based on role.

### 7.2 Product Creation Flow

1. Admin creates a category if needed.
2. Admin creates a product.
3. Product is stored with pricing and stock settings.
4. Audit entry is recorded.

### 7.3 Manual Stock Update Flow

1. Admin selects a product.
2. Admin enters stock in or stock out quantity.
3. Backend validates quantity.
4. Product stock and expiration data are updated if relevant.
5. Stock movement is recorded.
6. Audit entry is recorded.

### 7.4 Sale Flow

1. Cashier starts a new sale.
2. Cashier adds products and quantities.
3. Backend validates stock and calculates totals.
4. Cashier confirms cash payment.
5. Backend records payment.
6. Backend creates sale and sale items.
7. Backend decrements stock automatically.
8. Backend records stock movement entries.
9. System returns receipt data.

### 7.5 Dashboard Flow

1. Admin opens dashboard.
2. Backend aggregates daily sales metrics.
3. Backend returns low-stock products.
4. Backend returns products expiring within 5 days for admin alerting.
5. Frontend shows the operational summary.

## 8. Backend Modules for MVP

The MVP should be implemented with clean NestJS modules.

### 8.1 Auth Module

Responsibilities:

- login
- logout
- token handling
- authenticated user context

### 8.2 Users Module

Responsibilities:

- list seeded users
- expose basic user access data

### 8.3 Categories Module

Responsibilities:

- category CRUD

### 8.4 Products Module

Responsibilities:

- product CRUD
- product lookup
- product pricing and status rules

### 8.5 Inventory Module

Responsibilities:

- stock visibility
- stock in
- stock out
- stock movement recording

### 8.6 Sales Module

Responsibilities:

- sale creation
- sale items persistence
- totals calculation
- checkout orchestration

### 8.7 Payments Module

Responsibilities:

- cash payment registration
- payment status recording

### 8.8 Reports Module

Responsibilities:

- basic dashboard KPI queries only

### 8.9 Audit Module

Responsibilities:

- backend action traceability

## 9. Suggested MVP Data Model

The MVP domain model should remain simple.

Main entities:

- `User`
- `Role`
- `Category`
- `Product`
- `StockMovement`
- `Sale`
- `SaleItem`
- `Payment`
- `AuditLog`

Optional for a slightly cleaner stock design:

- `InventoryItem`

If implementation speed is the priority, stock can remain on `Product.currentStock` for the MVP, while `StockMovement` keeps the history.

Expiration tracking can be implemented in one of these MVP-friendly ways:

- simple approach: keep `expirationDate` directly on `Product`
- better retail approach: move expiration tracking to stock batches later if batch management is introduced after MVP

## 10. Suggested API Surface

This is the recommended API surface for the MVP.

### 10.1 Auth

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`

### 10.2 Users

- `GET /users`

### 10.3 Categories

- `GET /categories`
- `POST /categories`
- `PATCH /categories/:id`

### 10.4 Products

- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PATCH /products/:id`

### 10.5 Inventory

- `GET /inventory`
- `POST /inventory/stock-in`
- `POST /inventory/stock-out`
- `GET /inventory/expiring-soon`

### 10.6 Sales

- `POST /sales`
- `GET /sales/:id`

### 10.7 Reports

- `GET /reports/dashboard`

## 11. Frontend Screens for MVP

To stay realistic for two weeks, the frontend should include only a minimal set of screens.

Required screens:

- login page
- dashboard page
- product list page
- product creation/edit page
- category list page
- inventory page
- sale / checkout page
- simple receipt view

Optional only if time remains:

- user list page
- audit log page

## 12. Non-Functional Requirements for MVP

Even with reduced scope, the MVP should follow core quality rules.

### 12.1 Architecture

- backend remains the source of truth
- business logic stays in services
- controllers remain thin
- Prisma is the only database access layer

### 12.2 Security

- passwords must be hashed
- protected endpoints must require JWT
- role checks must protect admin-only actions
- secrets must come from environment variables

### 12.3 Data Integrity

- stock cannot go below zero
- sale totals must be calculated by backend
- payment completion must be linked to sale finalization
- stock must be decremented automatically when a sale is completed
- expiration date data must be stored consistently for tracked products

### 12.4 Traceability

- stock changes must be recorded
- completed sales must be traceable
- important admin actions should produce audit entries

## 13. Definition of Done for the MVP

The MVP is complete only if:

- authentication works end-to-end
- admin can manage categories
- admin can manage products
- admin can update stock manually
- cashier can create a sale
- cash payment works
- stock decreases automatically after sale
- expiration date can be created and updated for tracked products
- receipt data is generated after payment
- dashboard shows daily sales total
- dashboard shows number of daily sales
- dashboard shows low-stock products
- dashboard can expose products nearing expiration
- dashboard alerts the admin when a product is about to expire in 5 days
- backend builds successfully
- no blocking TypeScript errors remain
- no critical runtime errors remain

## 14. Two-Week Delivery Interpretation

This scope is realistic only if the team stays disciplined.

That means:

- build only required screens
- do not add optional features during implementation
- avoid redesigning the architecture mid-sprint
- avoid adding integrations not required by the MVP

The MVP is not the final system.

It is the smallest usable version that proves the business concept and supports a real grocery-store checkout workflow.

## 15. Post-MVP Roadmap

Once the MVP is stable, the next features can be introduced in phases.

### Phase After MVP

- customer management
- discounts
- richer payment methods
- better reports
- audit log UI

### Later Phase

- suppliers
- purchases
- delivery reception
- advanced inventory control
- exports

### Long-Term Phase

- multi-store support
- advanced RBAC
- alerts and notifications
- analytics and forecasting

## 16. Final Scope Statement

The official MVP for Moul Hanout is:

- a single-store POS system
- with fixed user roles
- with product and category management
- with manual stock control
- with expiration date tracking
- with a 5-day admin expiration alert
- with cash-only sales
- with simple receipt generation
- with a minimal operational dashboard

Anything outside this boundary is considered post-MVP and must not block the 2-week delivery plan.
