# Mini Finance Tracker v1

A localhost-first full-stack app for:
- Multi-user finance tracking with JWT auth
- Category-based monthly budgeting
- Automatic carryover pool from unused previous-month budgets
- Budget health dashboard and monthly summary reports

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: Neon Postgres (Prisma ORM)
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
- Deploy migrations:
  ```bash
  npm run prisma:migrate:deploy
  ```

Backend tests require a disposable Postgres database:

```bash
$env:TEST_DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
npm run test -w server
```

## Vercel

- Project root: repository root
- Build command: `npm run build`
- Output directory: `client/dist`
- API routes: `/api/*` through `api/index.js`
- Required env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN`
- Optional env var: `VITE_API_URL` only when frontend and API are split

## CI/CD

GitHub Actions runs the **Build and test** check on pull requests and pushes to `main`. It installs dependencies from the lockfile, builds all workspaces, then runs client and server tests against a disposable PostgreSQL service. The CI database is separate from the Vercel database and needs no GitHub secret.

Vercel's Git integration deploys each pull request as a preview and pushes to the production branch as production. Keep the Vercel project connected to this repository with the project root set to the repository root. Do not add a second deployment workflow or Vercel token when using this integration.

To require successful checks before release:

1. In GitHub, protect `main` with a ruleset or branch protection rule that requires pull requests and the **Build and test** status check. Require the branch to be up to date before merging if you want CI to test the latest `main` changes together with the pull request.
2. In Vercel's production environment settings, add **Build and test** as a Deployment Check if available for the project. This prevents a direct push to `main` from being promoted before CI passes. Without this setting, Vercel can deploy a push before GitHub Actions finishes.
3. Keep `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and `CORS_ORIGIN` in Vercel environment variables for the appropriate Preview and Production environments. Apply database migrations separately before code that needs a new schema is released; the CI migration runs only against its temporary database.

## API Endpoints

- Health:
  - `GET /api/health`
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Categories:
  - `GET/POST/PATCH/DELETE /api/categories`
- Transactions:
  - `GET/POST/PATCH/DELETE /api/transactions`
- Budgets:
  - `GET /api/budgets/:yearMonth`
  - `PUT /api/budgets/:yearMonth/items`
  - `POST /api/budgets/:yearMonth/close`
- Reports:
  - `GET /api/reports/monthly?from=YYYY-MM&to=YYYY-MM`

## Notes

- Currency is MMK only in v1.
- Amounts are stored as integer minor values.
- Budgets are expense-only in v1.
- Reports and budget summaries are scoped per authenticated user.
