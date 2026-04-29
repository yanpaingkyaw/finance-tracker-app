# FinanceTrackerApp — Senior Engineer Code Review

## What You Did Well
- **Monorepo with shared types** — Clean workspace setup with `@mini-finance/shared` for DTOs between client/server. Solid architectural choice.
- **Money as integers** — Storing amounts in minor units (cents) avoids floating-point bugs. This is the correct approach.
- **Prisma schema design** — Good normalization, composite unique constraints (`userId_yearMonth`, `userId_name_type`), proper cascading, and `onDelete: Restrict` on categories with transactions.
- **Error handling** — Custom `AppError` class, global error handler middleware, `asyncHandler` wrapper, Zod validation errors surfaced properly. Well done.
- **Auth flow** — bcrypt hashing, JWT, middleware-based route protection, per-user data isolation via `userId` foreign keys.

---

## Critical Issues

### 1. Zero Test Coverage
You have Vitest configured, `@testing-library` installed, `supertest` ready — but no test files exist. This is the single biggest gap. Your `budget-service.ts` has complex carryover logic that *will* break without regression tests.

### 2. JWT Secret Defaults to `"dev-secret"`
```ts
// server/src/config.ts
JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret"
```
This should **fail at startup** in production if unset. A silent fallback here is a ticking time bomb.

### 3. No Rate Limiting on Auth Endpoints
`/api/auth/login` and `/api/auth/register` are wide open to brute-force attacks. Add `express-rate-limit` — 5 attempts per minute on login is standard.

### 4. Race Condition in `ensureBudgetMonth()`
Two concurrent requests for the same month can both see "no budget exists" and both try to create one. Use a database-level `upsert` or wrap in a Prisma `$transaction` with serializable isolation.

### 5. Token in localStorage
Vulnerable to XSS. Any injected script can steal the JWT. Consider `httpOnly` cookies with `SameSite=Strict` instead.

---

## Important Issues

### 6. API Client Fallback Logic Masks Real Errors
`client.ts` tries multiple base URLs and continues on 404/405. A real 404 (resource not found) gets swallowed and retried against other URLs. This will make debugging production issues painful. Separate "server unreachable" from "server responded with an error."

### 7. No Confirmation on Destructive Actions
Deleting a category or transaction happens immediately on button click — no confirmation dialog. Users *will* accidentally delete data.

### 8. Reports Endpoint Loads Everything Into Memory
The reports route fetches all budget months and computes aggregations in JS. Push this to the database with `groupBy` / `aggregate` queries. This won't scale.

### 9. No React Error Boundaries
A rendering error in any component crashes the entire app. Wrap page-level routes in error boundaries.

### 10. Prisma Error Messages Leak to Client
In `error-handler.ts`, Prisma errors send `err.message` directly. This can expose table names, column names, and constraint details.

### 11. Password Policy Too Weak
Only `min(8)` characters. No uppercase, digit, or special character requirements.

---

## Minor But Worth Fixing

| Issue | Recommendation |
|---|---|
| No structured logging | Replace `console.error` with Pino or Winston. You need log levels, timestamps, and structured output for production. |
| No pagination on transactions | `findMany()` without `take`/`skip` will return unbounded results as data grows. |
| No `HTTPS` enforcement | Add `helmet` middleware and enforce HTTPS in production. |
| No CSRF protection | Not critical with Bearer tokens, but add if you ever switch to cookies. |
| Missing loading/optimistic UI | No caching layer (React Query/SWR). Every navigation re-fetches everything. |
| `useEffect` data fetching pattern | Consider React Query — it handles caching, deduplication, stale-while-revalidate, and error retries out of the box. |
| No `.env` validation at startup | Validate all required env vars on boot and fail fast with clear messages. |

---

## Prioritized Action Plan

| Priority | Action | Effort |
|---|---|---|
| **P0** | Add tests — start with `budget-service.ts` unit tests and auth route integration tests | 2-3 days |
| **P0** | Make `JWT_SECRET` required, crash on startup if missing | 10 min |
| **P0** | Add `express-rate-limit` to auth routes | 30 min |
| **P1** | Fix `ensureBudgetMonth` race condition with upsert | 1 hour |
| **P1** | Stop leaking Prisma errors to client | 30 min |
| **P1** | Add confirmation dialogs for delete actions | 1-2 hours |
| **P1** | Add React error boundaries | 1 hour |
| **P1** | Fix API client fallback to not swallow real errors | 1 hour |
| **P2** | Switch to httpOnly cookie auth | Half day |
| **P2** | Add pagination to transactions | 1-2 hours |
| **P2** | Replace console.error with structured logging | 1-2 hours |
| **P2** | Add React Query for data fetching | 1 day |
| **P3** | Optimize reports with DB aggregation | Half day |
| **P3** | Add `helmet` middleware | 15 min |
| **P3** | Password complexity requirements | 30 min |

---

## Bottom Line

This is a **well-architected project** with good separation of concerns, solid TypeScript usage, and correct money handling. The fundamentals are strong. The gaps are in **production hardening** — testing, security tightening, and resilience patterns. The P0 items above should be addressed before any production deployment.
