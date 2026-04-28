# Mini Finance Tracker v1

## Architecture

### 1. System Overview
- Goal: Vercel-ready finance tracker with multi-user auth, budgeting, and monthly reports.
- Frontend: React + Vite + TypeScript + Tailwind CSS (`client`).
- Backend: Node.js + Express + TypeScript (`server`).
- Database: Neon Postgres via Prisma ORM.
- Shared contracts: shared DTO/types package (`shared`) used by client and server.

### 2. High-Level Architecture
- Client layer
  - Authentication UI (register/login/logout).
  - Protected app routes and pages: Dashboard, Transactions, Categories, Budgets, Reports.
  - API service layer for HTTP communication.
- API layer
  - Express routes for auth, categories, transactions, budgets, reports.
  - Vercel Node Function adapter at `api/[...path].ts` for `/api/*`.
  - Middleware for JWT auth, validation, and unified error responses.
- Domain layer
  - Budget service for month creation, carryover pool, overspend offset logic, and reporting.
- Persistence layer
  - Prisma Client + Neon Postgres.
  - User-scoped records for strict data isolation.

### 3. Workspace Structure
- `client`: UI, routing, state/context, API client, tests.
- `server`: Express app, routes, services, middleware, Prisma schema/migrations, tests.
- `shared`: Shared TypeScript interfaces and DTOs.

### 4. Data Model (Core Entities)
- `User`
  - `id`, `email`, `passwordHash`, timestamps.
- `Category`
  - `id`, `name`, `type` (`INCOME`/`EXPENSE`), `isSeed`, `userId`.
- `Transaction`
  - `id`, `amountMinor`, `type`, `date`, `note`, `userId`, `categoryId`.
- `BudgetMonth`
  - `id`, `userId`, `yearMonth`, `carryoverPoolMinor`, `closedAt`.
- `BudgetItem`
  - `id`, `budgetMonthId`, `categoryId`, `plannedMinor`.

### 5. API Surface
- Auth
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
- Categories
  - `GET /categories`
  - `POST /categories`
  - `PATCH /categories/:id`
  - `DELETE /categories/:id`
- Transactions
  - `GET /transactions?yearMonth=YYYY-MM`
  - `POST /transactions`
  - `PATCH /transactions/:id`
  - `DELETE /transactions/:id`
- Budgets
  - `GET /budgets/:yearMonth`
  - `PUT /budgets/:yearMonth/items`
  - `POST /budgets/:yearMonth/close`
- Reports
  - `GET /reports/monthly?from=YYYY-MM&to=YYYY-MM`

### 6. Budgeting and Rollover Rules
- Budgeting is expense-only by category.
- New month creation behavior:
  - Auto-create month record on first access.
  - Copy previous month planned budget items.
  - Compute previous month unused budget and move into new month global carryover pool.
- Overspending behavior:
  - Category remaining = `plannedMinor - spentMinor`.
  - Aggregate overspending is auto-offset using carryover pool.
  - Exposed summary values:
    - `carryoverPoolMinor`
    - `carryoverUsedMinor`
    - `carryoverRemainingMinor`
    - `effectiveDeficitMinor`

### 7. Security and Isolation
- JWT bearer token auth.
- Password hashing with bcrypt.
- Every protected query is scoped by `userId`.
- Validation with Zod and normalized error response format.
