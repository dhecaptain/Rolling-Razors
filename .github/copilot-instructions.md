# Copilot instructions for Rolling Razors

## Build, test, and development commands

This repository uses npm, TypeScript, Vite, Express, Prisma, PostgreSQL, and Playwright.

```bash
npm ci                         # install the lockfile-resolved dependencies
npm run dev                    # start the Express/Vite development server on port 3000
npm run build                  # build the Vite client and bundle server.ts
npm start                      # run the production bundle in dist/
npm run typecheck              # TypeScript validation without emitting files
npm run lint                   # alias for npm run typecheck
npm run format                # format src/**/*.ts(x) and server/**/*.ts
```

Database commands require `DATABASE_URL` to point to PostgreSQL:

```bash
npm run db:migrate             # apply/create a development migration
npm run db:generate            # regenerate the Prisma client
npm run db:seed                # seed users, services, CRM data, and inventory
npm run db:studio              # open Prisma Studio
npm run db:reset               # destructive local reset and reseed
```

Playwright starts the app automatically through `playwright.config.ts` and uses `http://localhost:3000`:

```bash
npm run test:e2e
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/auth.spec.ts -g "customer can register and login"
npm run test:e2e:ui
```

The CI workflow also runs `npx prisma migrate deploy`, `npx playwright install --with-deps chromium`, `npx prisma generate --check`, `deno lint`, and `deno test -A`.

## Architecture

- `src/main.tsx` mounts the React application, Sentry, and the Clerk provider when a client publishable key enables Clerk. `src/App.tsx` provides the top-level layout, navigation views, lazy-loaded dashboards, and global modals/notifications.
- `src/context/AppContext.tsx` is the frontend coordination layer. It owns view navigation, auth state, server re-verification/synchronization, shared collections, optimistic UI actions, and the authenticated fetch helper. Feature components live under `src/components/` and consume this context rather than owning a separate application store.
- `server.ts` is the single Express entry point and also creates the Vite dev server or serves the production `dist/` build. It defines the REST API for auth, bookings, vehicles, work orders, invoices, services, inventory, audit logs, and M-Pesa.
- `server/db.ts` is the persistence boundary. It maps Prisma records to the frontend domain types and performs most database reads/writes through `serverDb`; use it instead of adding ad-hoc Prisma mapping in route handlers. `server/prisma.ts` owns the shared Prisma client.
- `prisma/schema.prisma` defines the PostgreSQL model for users, customers, vehicles, bookings, work orders, invoices, services, staff, M-Pesa transactions, OTPs, audit logs, and inventory. Schema changes must be accompanied by a Prisma migration.
- Authentication has two supported providers. `AUTH_PROVIDER=legacy` uses custom HS256 JWTs plus phone OTP/admin credentials; `AUTH_PROVIDER=clerk` mounts Clerk server middleware and derives the role from verified Clerk metadata or the admin ID allowlist. The backend is authoritative for identity and role in both modes.
- Admin API access is layered: authentication, `requireAdmin`, and where applicable Casbin policies from `server/casbin/model.conf` and `server/casbin/policy.csv`. Customers must not be granted admin access by client state, request payloads, or URL navigation.
- Booking creation writes a booking and its initial work order in one Prisma transaction. M-Pesa STK initiation creates a pending transaction; callback/query/reconciliation paths transition the transaction and update the related booking/invoice idempotently.
- `prisma/seed.ts` seeds the database from `src/data/mockData.ts`, so mock data is primarily seed/demo input rather than the production source of truth.

## Repository-specific conventions

- Keep API responses in the existing `{ success: true, ... }` / `{ success: false, error }` shape and preserve the established HTTP status behavior. Paginated endpoints use `page`, `limit`, `total`, and `pages`; the server caps `limit` at 100.
- Validate request bodies with the Zod schemas in `server/validators.ts` before using them. Add or update a schema when introducing a new structured API payload rather than validating fields ad hoc in multiple routes.
- Normalize Kenyan phone numbers with the helpers in `server/phone.ts` and `src/utils/phone.ts`; compare phones with `phonesMatch`/`phoneKey` instead of raw string equality.
- Treat monetary values as integer Kenyan shillings. Booking deposits are derived server-side from the service price, and M-Pesa amounts must be checked against the booking/invoice amount on the server.
- Use the server-authenticated user (`req.user`) for ownership and authorization decisions. Local storage is only an optimistic legacy-session cache and must never be used as the authoritative role or identity.
- Reuse `isStaff`, `isCustomer`, `canAccessAdmin`, and `STAFF_VIEWS` from `AppContext` for frontend role/view checks. Protected API routes still need backend middleware even when a component is already gated.
- Preserve booking/work-order status transition validation and create audit logs for privileged or state-changing operations following the existing route patterns.
- Keep secrets server-only. Client-exposed Vite variables must use `VITE_`; Clerk's publishable key may be exposed, but `CLERK_SECRET_KEY`, auth secrets, M-Pesa credentials, and callback secrets must not be bundled or committed.
- The default E2E configuration uses the legacy provider and raises rate limits for parallel tests. Clerk-mode tests require a dedicated Clerk test instance; specs detect the provider via `/api/health` and skip legacy-only flows when Clerk is active.
- E2E tests run in parallel and booking slots must be unique; use the `uniqueAppointment()` helper rather than hard-coding a date/time pair.
- Keep domain types synchronized between `src/types/index.ts`, Prisma mappings in `server/db.ts`, and the Prisma schema. When adding a persisted field, update all three layers plus seed/migration data as needed.
