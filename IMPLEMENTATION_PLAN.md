# Mini Finance Tracker v1

## Implementation Plan

### 1. Objective
- Deliver a localhost-first full-stack finance tracker with:
  - Multi-user auth (email/password + JWT).
  - Per-user isolated transactions, categories, and budgets.
  - Expense-only category budgeting.
  - Monthly carryover pool that auto-offsets overspending.
  - Dashboard and monthly reports.

### 2. Phase Plan
1. Foundation
- Set up monorepo workspaces and base TypeScript config.
- Add shared contracts package for API DTOs/types.

2. Backend Core
- Define Prisma schema and generate client.
- Implement auth routes and middleware.
- Implement CRUD routes for categories and transactions.

3. Budget Domain
- Implement monthly auto-creation on first access.
- Copy previous month planned budget items.
- Compute carryover pool from previous unused budget.
- Apply carryover pool automatically to offset aggregate overspending.
- Implement close-month behavior and next-month initialization.

4. Frontend Core
- Implement register/login/logout flow and protected routes.
- Build pages:
  - Dashboard (budget health and quick monthly summary).
  - Transactions (CRUD + month filtering).
  - Categories (seed + custom CRUD).
  - Budgets (monthly plan editing + close month).
  - Reports (monthly summary and category totals).

5. Quality and Verification
- Backend tests:
  - auth hashing/token flow.
  - user data isolation.
  - budget math and carryover behavior.
  - monthly report totals.
- Frontend tests:
  - protected route behavior.
  - auth screen mode behavior.
  - dashboard budget-health rendering.
- Build verification:
  - compile `shared`, `server`, and `client`.

### 3. Deliverables
- Running full-stack app (`npm run dev`).
- Prisma schema + initial migration.
- Shared type contracts for consistent client/server API typing.
- Passing tests and successful production builds.

### 4. Constraints and Defaults
- Localhost deployment only in v1.
- Single currency: MMK.
- Monetary amounts stored as integer minor units.
- No recurring transactions, savings goals, or multi-currency in v1.

### 5. Current Status
- Plan has been implemented end-to-end in the current workspace.
- Tests and builds are passing.
- This file is the implementation roadmap baseline for v1 evolution.

### 6. Version 1.2: Transaction List Performance
- Objective: bound transaction list requests and make the month, type, category, and note filters work across all matching records.
- Backend: validate list query parameters; apply user-scoped filters in Prisma; count matches; fetch only the requested page with deterministic descending order; return pagination metadata.
- Frontend: update the typed API client, show 20 rows per page with numbered navigation, debounce note search, reset pages on filter changes, and discard stale list responses. After create, edit, or delete, reload the list and move back one page if a deletion empties the current page.
- Dashboard: request only the three newest transactions for the selected month.
- Verification: cover combined filters, malformed queries, page boundaries, ordering, tenant isolation, and UI navigation and mutations. Run client tests and build; run server tests with a disposable `TEST_DATABASE_URL`.
- Release: update the README and workspace package versions to `1.2.0` with the feature.
- Status: implementation and documentation are updated; client tests and production build pass. Server integration tests require a disposable `TEST_DATABASE_URL` and remain to be run.
