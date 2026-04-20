# Mini Finance Tracker v1

A localhost-first full-stack app for:
- Multi-user finance tracking with JWT auth
- Category-based monthly budgeting
- Automatic carryover pool from unused previous-month budgets
- Budget health dashboard and monthly summary reports

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: SQLite (Prisma ORM)
- Shared contracts: workspace package `@mini-finance/shared`
- Tests: Vitest (frontend + backend), Supertest (backend integration)

## Workspace Layout

- `client`: React app (port `5173`)
- `server`: Express API (port `4100`)
- `shared`: shared TypeScript DTO/types

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure backend env:
   ```bash
   copy server\\.env.example server\\.env
   ```
3. Generate Prisma client and create schema:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
4. Run both apps:
   ```bash
   npm run dev
   ```

## Useful Commands

- Run all tests:
  ```bash
  npm test
  ```
- Server tests only:
  ```bash
  npm run test -w server
  ```
- Client tests only:
  ```bash
  npm run test -w client
  ```
- Build all workspaces:
  ```bash
  npm run build
  ```

## API Endpoints

- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
- Categories:
  - `GET/POST/PATCH/DELETE /categories`
- Transactions:
  - `GET/POST/PATCH/DELETE /transactions`
- Budgets:
  - `GET /budgets/:yearMonth`
  - `PUT /budgets/:yearMonth/items`
  - `POST /budgets/:yearMonth/close`
- Reports:
  - `GET /reports/monthly?from=YYYY-MM&to=YYYY-MM`

## Notes

- Currency is MMK only in v1.
- Amounts are stored as integer minor values.
- Budgets are expense-only in v1.
- Reports and budget summaries are scoped per authenticated user.
