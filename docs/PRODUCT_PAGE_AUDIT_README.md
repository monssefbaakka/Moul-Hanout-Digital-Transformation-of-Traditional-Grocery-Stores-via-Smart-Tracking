# Product Page Audit README

## Purpose

This document is a full audit of the work completed on the product creation page at:

- `frontend/src/app/produits/products-workspace.tsx`

It explains:

1. What the page was doing before
2. What was changed step by step
3. Why each change was made
4. Which backend and API adjustments were required
5. How the final behavior now fits the project architecture
6. What was verified
7. What remains outside the scope of this task

---

## Scope of the Audit

Files changed for this task:

- `frontend/src/app/produits/products-workspace.tsx`
- `frontend/src/lib/api/api-client.ts`
- `backend/src/modules/products/products.controller.ts`
- `backend/src/modules/products/products.service.ts`

No shared types were changed.
No database schema or Prisma migration was changed.
No unrelated modules were modified.

---

## Initial Problem

The user request was to make the "Add New Product" page compatible with the real project because it looked static.

Even though the page already called some real APIs, the experience still felt disconnected from the rest of the application for several reasons:

1. The page used a very custom "studio" layout and interaction style that did not match the rest of the owner workspaces.
2. The UX felt like a designed mockup rather than an operational business screen.
3. The page supported draft creation in the UI, but the visible product list only loaded active products from the backend.
4. The page did not fully reflect the backend rules in a clear, project-oriented way.
5. The flow around initial stock and draft publishing needed to be made more explicit and more aligned with the inventory service.

---

## Architectural Goal

The project rules in `AGENTS.md` emphasize:

- frontend must consume backend APIs only
- shared types must be used as the contract
- business rules must stay in backend services
- no duplicated business logic should be introduced unnecessarily

The target solution therefore was:

1. Keep the frontend as an API consumer
2. Preserve the shared product contract
3. Improve the page UX without moving business logic into the frontend
4. Add only lightweight frontend validation that mirrors already-known rules for better usability
5. Fix the API gap that prevented the owner workspace from showing drafts

---

## Step-by-Step Audit

### Step 1: Audited the current product page

File inspected:

- `frontend/src/app/produits/products-workspace.tsx`

What I found:

- The page already used `categoriesApi`, `productsApi`, and `inventoryApi`.
- The form already created products through the backend.
- The page already supported both draft and publish intents.
- The page was visually and structurally much more custom than the rest of the app.

Why this mattered:

- The problem was not that the page was completely fake.
- The real issue was that it behaved like a partially connected mock instead of a natural part of the application.

Decision:

- Refactor the page so it feels like a real owner workspace used in production.

---

### Step 2: Compared the product page with the rest of the frontend

Files inspected:

- `frontend/src/app/categories/categories-workspace.tsx`
- `frontend/src/app/inventaire/inventory-workspace.tsx`
- `frontend/src/app/utilisateurs/users-workspace.tsx`
- `frontend/src/app/globals.css`

What I found:

- The rest of the app uses a simpler and more consistent structure:
  - `page`
  - `stack`
  - `hero`
  - `panel`
  - `form-grid`
  - `field`
  - `product-list`
  - `inventory-table`
- The product page was the outlier in both layout and tone.

Why this mattered:

- Consistency is part of project compatibility.
- A page can be technically functional and still be wrong for the system if it breaks the established UI language.

Decision:

- Replace the custom "studio" structure with the same workspace patterns already used by the rest of the project.

---

### Step 3: Audited backend product rules before changing the frontend

Files inspected:

- `backend/src/modules/products/dto/product.dto.ts`
- `backend/src/modules/products/products.service.ts`
- `backend/src/modules/products/products.controller.ts`

What I found:

- Product name is required
- Category id is required
- Sale price must be `>= 0`
- Cost price must be `>= 0`
- Barcode must be unique within a shop
- Cost price cannot be greater than sale price
- Expiration date must be an ISO date string
- Default low stock threshold is applied in backend when omitted

Why this mattered:

- The frontend should not invent different rules.
- The page needed to present and respect the real backend constraints.

Decision:

- Keep backend as source of truth.
- Add only usability-oriented frontend validation for rules that are already explicit in the backend.

---

### Step 4: Identified a real product-workspace mismatch

Problem discovered:

- The product page UI supported drafts.
- The frontend loaded products with `productsApi.list()`.
- The backend `GET /products` endpoint only returned active products.

Impact:

- A newly saved draft would not appear in the product library shown on the page.
- This made the feature feel broken or fake even when the draft was actually saved correctly.

Why this mattered:

- This was not just a UX issue.
- It was a contract mismatch between what the page promised and what the API returned.

Decision:

- Add a dedicated owner-only endpoint for loading all products, including drafts.

---

### Step 5: Added a backend owner-only "manage" endpoint

Files changed:

- `backend/src/modules/products/products.service.ts`
- `backend/src/modules/products/products.controller.ts`

Changes made:

1. Added `findAllByShop(shopId)` in `ProductsService`
2. Added `GET /products/manage` in `ProductsController`
3. Protected this route with the existing owner role restriction
4. Returned all products for the shop, ordered with active products first, then by name

Why this was necessary:

- Owners need a management view, not just the customer-facing/active view.
- Drafts are management data and should remain visible in the owner workspace.
- This keeps the architecture clean:
  - controller stays thin
  - service owns the data query
  - Prisma remains the only database access layer

Why this is compatible with the project:

- No raw SQL was added
- No business logic was moved into controllers
- The backend remains the source of truth for product visibility rules

---

### Step 6: Extended the frontend API client

File changed:

- `frontend/src/lib/api/api-client.ts`

Change made:

- Added `productsApi.listAll()` that calls `GET /products/manage`

Why this was necessary:

- The page needed an explicit API method for the owner workspace.
- This keeps API access centralized in the frontend API client instead of embedding fetch logic directly in the page.

Why this is compatible with the project:

- The page remains a consumer only
- API access stays centralized
- Shared `Product` typing continues to be used

---

### Step 7: Rebuilt the page state model around real workflow needs

File changed:

- `frontend/src/app/produits/products-workspace.tsx`

Changes made:

1. Expanded form state to include:
   - `expirationDate`
   - `initialStock`
2. Introduced `SubmitIntent = 'publish' | 'draft'`
3. Added helper constants:
   - `DEFAULT_LOW_STOCK_THRESHOLD`
   - `DEFAULT_INITIAL_STOCK`
   - `INITIAL_STOCK_REASON`
4. Replaced the static `INITIAL_FORM` object with `createInitialForm(categoryId)`

Why this was necessary:

- The page needed to support real product creation and real opening-stock flow cleanly.
- Using `createInitialForm(categoryId)` makes the reset behavior smarter because it can keep a valid category selected after loading data or after creation.

Why this improves compatibility:

- The form now reacts to real catalog state instead of behaving like a fixed mock.

---

### Step 8: Added small utility helpers that support backend-compatible formatting

Helpers added:

- `toIsoDate(dateValue)`
- `buildPayload(form, intent)`
- `formatMoney(value)`
- `formatDate(value)`
- `getDraftState(form, defaultCategoryId)`
- `getProductStatusTone(product)`
- `getProductStatusLabel(product)`

Why these were necessary:

- `toIsoDate` ensures date values are sent in the ISO format expected by the backend
- `buildPayload` centralizes the DTO-building logic
- `formatMoney` and `formatDate` keep display consistent
- `getDraftState` helps show whether the form has unsaved changes
- status helper functions make the product table easier to interpret

Why this is acceptable architecturally:

- These are presentation and request-shaping helpers
- They do not replace backend business rules
- They reduce duplication inside the component

---

### Step 9: Improved workspace loading behavior

Changes made:

1. Added `isLoading` state
2. Updated the initial load to use:
   - `categoriesApi.list()`
   - `productsApi.listAll()`
3. Preserved owner-only access
4. Ensured category fallback logic remains valid after loading

Why this was necessary:

- The page needed to clearly distinguish loading state from empty state.
- It also needed to load the full owner view of products, not just active ones.

Why this improves the page:

- The page now behaves like an actual workspace dashboard:
  - it loads required reference data
  - it derives a valid default category
  - it handles empty categories safely

---

### Step 10: Added discard and refresh behavior

Changes made:

- Added `handleDiscard()`
- Added `refreshProducts(categoryIdFallback)`

Why this was necessary:

- A management page should let the owner clear in-progress edits cleanly.
- After creating a product, the page should refresh from backend state rather than assuming the local list is still correct.

Why this improves correctness:

- Refreshing from the backend is safer than only appending local optimistic state.
- This is especially important because creating an active product and then adding initial stock is a two-step backend workflow.

---

### Step 11: Tightened submit logic around real backend rules

Changes made inside `handleSubmit`:

1. Read which button triggered the submit
2. Distinguished between `draft` and `publish`
3. Parsed numeric values safely
4. Added checks for:
   - category existence
   - non-negative sale price
   - non-negative cost price
   - cost price not exceeding sale price
   - draft not allowing opening stock
5. Created the product through `productsApi.create(buildPayload(...))`
6. If publishing with opening stock, called `inventoryApi.stockIn(...)`
7. Refreshed the owner product library from the backend
8. Reported clear success messages based on the actual outcome

Why this was necessary:

- The original flow felt visually rich but operationally under-explained.
- The page now reflects the system more clearly:
  - create product first
  - optionally post initial stock through inventory
  - reload authoritative data

Why the validations are appropriate:

- They are not new business rules
- They mirror already-known backend constraints so the user gets faster feedback

---

### Step 12: Replaced the custom page shell with the project’s common workspace layout

Main structural change:

- The old "studio" page structure was replaced with the same layout language used elsewhere in the repo

New top-level sections:

1. Hero section
2. Status cards
3. Back-to-inventory panel
4. Success/error feedback
5. Empty-category guard section
6. Main two-column workspace
7. Catalog library table

Why this was necessary:

- The page needed to stop feeling like a standalone UI experiment.
- It now looks and behaves like a sibling of:
  - inventory workspace
  - categories workspace
  - users workspace

Why this improves project compatibility:

- Less custom visual structure
- Better reuse of established design primitives
- Easier maintenance for the team

---

### Step 13: Added a clear business-facing form structure

Form fields now cover:

- Product name
- Category
- Sale price
- Cost price
- Barcode
- Unit
- Opening stock
- Low stock alert
- Expiration date
- Photo URL
- Description

Why this was necessary:

- The form now exposes the actual product and inventory data the project is built around.
- It makes the product creation flow operational instead of decorative.

Why this is better than the old version:

- More direct
- Less visual filler
- Stronger alignment with backend DTO fields and inventory flow

---

### Step 14: Added real-time summary panels

New side-panel content:

1. Live product summary
2. Operational preview
3. Owner guidance

What these do:

- Show current category selection
- Show margin preview
- Show opening stock implications
- Show expiry preview
- Remind the owner of the actual business rules

Why this was necessary:

- The original version had decorative feel.
- The new summary is informational and operational.
- It helps the owner understand what will be sent and what the result means.

---

### Step 15: Replaced the mock-like product snapshot area with a real catalog library

New section:

- `Catalog library`

Displayed as a real table with:

- Product
- Category
- Sale price
- Stock
- Threshold
- Expiry
- Status

Why this was necessary:

- After product creation, the user should immediately see the updated product state in a management-ready table.
- The table now reflects:
  - active items
  - drafts
  - low-stock state

Why this improves trust:

- The page no longer looks like a design sample.
- It now clearly reflects backend data and owner-facing operational status.

---

### Step 16: Kept role-based access consistent

Behavior preserved:

- Unauthenticated users see loading then redirect behavior
- Non-owner users are redirected away
- Owner-only management actions remain owner-only

Why this was important:

- Product creation is an owner capability in this system.
- The page must match backend authorization expectations.

---

## Why These Changes Were the Right Level of Change

The request was to make the page compatible with the project, not to redesign the entire product domain.

So the approach was intentionally limited:

- no schema changes
- no new dependency additions
- no API breaking changes to existing `/products`
- no changes to shared contracts
- no unrelated CSS rewrite

Instead, the work focused on:

- better alignment with existing frontend patterns
- clearer use of current backend rules
- one minimal backend addition to support the owner workspace properly

This keeps the change precise and scalable.

---

## Functional Result After the Changes

The product page now:

1. Loads categories and all owner-visible products
2. Shows active products and drafts in one management view
3. Lets the owner save a draft
4. Lets the owner publish a product
5. Lets the owner apply initial stock only when publishing
6. Displays clearer validation and outcome messages
7. Uses the same visual workspace language as the rest of the app
8. Feels like a real internal management page instead of a mock screen

---

## Verification Performed

### Frontend verification

Commands run:

- `npm run lint --workspace frontend`
- `npm run build --workspace frontend`

Result:

- Both passed successfully

Meaning:

- The refactored page is lint-clean
- The frontend compiles and type-checks successfully

### Backend verification

Command run:

- `npm run build --workspace backend`

Result:

- This did not complete successfully

Reason:

- There are pre-existing TypeScript errors in:
  - `backend/src/modules/inventory/inventory.service.ts`

Specific failing lines reported during build:

- around line 183: `movement.product.name`
- around line 187: `movement.user.id`
- around line 188: `movement.user.name`

Important note:

- These backend errors were already outside the scope of the product page work.
- They are not introduced by the product page changes.

---

## Architecture Review Summary

### Frontend

- Uses backend APIs only
- Uses shared `Product`, `Category`, and `CreateProductInput` types
- Does not duplicate backend business logic beyond lightweight UX validation

### Backend

- Controller remains thin
- Service contains the query logic
- Prisma remains the database access mechanism
- Existing `/products` behavior was preserved
- New owner-only `/products/manage` endpoint was added for management visibility

### Shared layer

- No duplicate types were introduced
- Existing shared contracts were reused as intended

---

## Tradeoffs and Decisions

### Why not keep the original "studio" UI and just patch the data flow?

Because the issue was not only data.
The page also felt inconsistent with the application’s real workspace design language.

### Why add frontend validation if backend already validates?

Because fast feedback improves usability.
The backend still remains the source of truth.

### Why add a new endpoint instead of changing `GET /products`?

Because the current `GET /products` clearly serves active-product consumption.
Changing it could affect other consumers.
Adding `GET /products/manage` keeps responsibilities clearer and avoids breaking existing behavior.

---

## Final Outcome

This task did not just "make the form submit."

It corrected the product page at three levels:

1. Visual alignment with the project
2. Workflow alignment with the backend and inventory flow
3. Data visibility alignment for owner-facing draft management

As a result, the page is now better integrated with the actual architecture and day-to-day management use case of the application.

---

## Suggested Next Follow-Up

Optional future improvements, not part of this task:

1. Add product edit support in the same owner workspace
2. Add filtering for draft / active / low-stock products
3. Add image upload support if the product photo should not depend on raw URLs
4. Fix the existing backend inventory TypeScript errors so backend build verification can pass fully

