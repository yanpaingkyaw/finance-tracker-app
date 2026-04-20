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
