# Inventory MVP Audit Report

Date: 2026-04-18
Repository: `Moul-Hanout-Digital-Transformation-of-Traditional-Grocery-Stores-via-Smart-Tracking`

## 1. Audit Purpose

This report summarizes the current state of the inventory MVP implementation.

It answers:

- what was implemented
- which files and subsystems were touched
- what is functionally working
- what was verified
- what still blocks the inventory slice from being fully complete

## 2. Executive Summary

The inventory MVP slice was largely implemented across the backend, shared contract layer, Prisma schema, seed data, and frontend UI.

Delivered capabilities include:

- a new backend inventory module
- stock view for owners and cashiers
- owner-only stock-in and stock-out endpoints
- expiring-soon inventory query
- stock movement persistence
- audit log persistence for stock changes
- a new `/inventaire` page with role-aware behavior
- cashier redirect to inventory after login
- shared inventory request/response types
- seed data updated with realistic stock and expiration examples

Current recommendation:

- `Do not commit this as fully complete yet`

Reason:

- the backend still fails to build because of a typing issue in `inventory.service.ts` around included `stockMovement` relations (`movement.product` / `movement.user`)

The frontend side is in better shape than earlier validation showed:

- frontend lint passes
- frontend production build now passes

So the only confirmed blocking issue is the backend compile error.

## 3. Scope Of Changes

### Backend domain and app wiring

New inventory module added:

- `backend/src/modules/inventory/inventory.module.ts`
- `backend/src/modules/inventory/inventory.controller.ts`
- `backend/src/modules/inventory/inventory.service.ts`
- `backend/src/modules/inventory/dto/inventory.dto.ts`

Application wiring updated:

- `backend/src/app.module.ts`

### Product and schema updates

Inventory-related product changes:

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260418113000_add_product_expiration_date/migration.sql`
- `backend/src/modules/products/dto/product.dto.ts`
- `backend/src/modules/products/products.service.ts`

### Seed data

Seed enhancements:

- `backend/prisma/seeds/seed.ts`

The seed now includes:

- realistic stock quantities
- product-level expiration dates for selected products

### Shared contract updates

Shared types updated in:

- `packages/shared-types/src/index.ts`

Added:

- `InventoryItem`
- `StockMovementEntry`
- `StockInInput`
- `StockOutInput`
- `Product.expirationDate`
- `CreateProductInput.expirationDate`
- `UpdateProductInput.expirationDate`

### Frontend inventory implementation

New inventory route and screen:

- `frontend/src/app/inventaire/page.tsx`
- `frontend/src/app/inventaire/inventory-workspace.tsx`

Supporting frontend changes:

- `frontend/src/lib/api/api-client.ts`
- `frontend/src/lib/auth/auth-routes.ts`
- `frontend/src/components/auth/owner-quick-links.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/globals.css`

### Test coverage

Backend e2e suite expanded in:

- `backend/test/app.e2e-spec.ts`

## 4. Functional Behavior Implemented

### 4.1 Inventory listing

Implemented:

- `GET /inventory`

Intended behavior:

- owners can view inventory
- cashiers can view inventory
- response includes product identity, stock data, threshold data, expiration date, low-stock flag, and expiring-soon flag

### 4.2 Stock in

Implemented:

- `POST /inventory/stock-in`

Intended behavior:

- owner-only
- validates positive quantity
- increases `currentStock`
- updates product `expirationDate` when provided
- records `StockMovement(type=IN)`
- records `AuditLog(action=STOCK_IN)`

### 4.3 Stock out

Implemented:

- `POST /inventory/stock-out`

Intended behavior:

- owner-only
- validates positive quantity
- blocks stock-out above available stock
- decreases `currentStock`
- records `StockMovement(type=OUT)`
- records `AuditLog(action=STOCK_OUT)`

### 4.4 Expiring soon

Implemented:

- `GET /inventory/expiring-soon`

Intended behavior:

- owner-only
- returns active products with stock greater than zero
- returns only products whose `expirationDate` is within the next 5 days

### 4.5 Movement history

Implemented:

- `GET /inventory/movements`

Intended behavior:

- owner-only
- returns recent stock movements
- no dedicated UI screen yet

### 4.6 Frontend inventory workspace

Implemented:

- `/inventaire`

Behavior:

- owner sees inventory KPIs, stock-in form, stock-out form, expiring-soon section, and stock table
- cashier sees read-only stock table
- cashier login redirect now points to `/inventaire`

## 5. Validation Results

### Passed

- `npm run build --workspace @moul-hanout/shared-types`
- `npm run lint --workspace frontend`
- `npm run build --workspace frontend`
- `npm run test:e2e --workspace backend`
- `npm run prisma:generate --workspace backend`

### Failed

- `npm run build --workspace backend`

Observed backend compile issue:

- `backend/src/modules/inventory/inventory.service.ts`
- TypeScript does not accept `movement.product` and `movement.user` on the `stockMovement.findMany(... include ...)` result mapping

Current compiler errors:

- `Property 'product' does not exist on type ...`
- `Property 'user' does not exist on type ...`

## 6. Testing Coverage Added

The backend e2e suite currently passes with 21 tests and includes the following new inventory scenarios:

- owner can access `GET /inventory`
- cashier can access `GET /inventory`
- cashier gets `403` on `POST /inventory/stock-in`
- cashier gets `403` on `POST /inventory/stock-out`
- stock-in increases stock
- stock-out decreases stock
- stock-out above available stock returns `422`
- stock-in records stock movement
- stock-out records stock movement
- stock-in records audit log
- stock-out records audit log
- stock-in with expiration date updates expiration field
- owner can access `GET /inventory/expiring-soon`
- cashier is denied `GET /inventory/expiring-soon`
- owner can access `GET /inventory/movements`

## 7. Architecture Review

### What is good

- inventory was added as a dedicated NestJS module
- controller/service separation was preserved
- Prisma remains the only data access layer
- shared contract types were extended instead of duplicating frontend shapes
- frontend remains a consumer of backend behavior
- inventory permissions align with the MVP role model:
  - owner = mutate inventory
  - cashier = read-only stock visibility

### What is intentionally simple

- expiration tracking is product-level, not batch-level
- movement history exists only at the API/backend level
- no alert system or background processing is introduced
- no inventory history UI is included yet

## 8. Risks And Open Items

### High priority blocker

1. Fix the relation typing in `backend/src/modules/inventory/inventory.service.ts`
2. Re-run backend build
3. Re-run the backend e2e suite after the typing fix

### Medium priority follow-up

1. Add backend unit tests for inventory service logic
2. Consider surfacing movement history in a simple admin panel later
3. Consider updating the products page to display/edit expiration date directly if product editing is part of the next workflow pass

## 9. MVP Status Impact

This change materially advances the MVP because it introduces the first real stock-control slice needed before sales and dashboard work.

Inventory MVP status after this implementation:

- backend design direction: strong
- API coverage: largely implemented
- frontend inventory screen: implemented
- validation status: mostly good
- release readiness: blocked by backend compile issue

Estimated completion for the inventory slice:

- `85% to 90%`

## 10. Recommended Next Step

Recommended immediate next action:

- fix the `inventory.service.ts` movement relation typing issue

After that:

1. re-run `npm run build --workspace backend`
2. re-run `npm run test:e2e --workspace backend`
3. consider the inventory slice functionally complete
4. move to sales + checkout implementation

## 11. Short Conclusion

The inventory MVP slice is mostly implemented and structurally aligned with the project architecture.

The frontend inventory route is in place, the backend inventory endpoints exist, the shared contracts are updated, and backend e2e coverage is already passing.

The only confirmed blocker preventing a clean completion state is the backend build failure caused by the movement relation typing in `inventory.service.ts`.
