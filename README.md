# Rolling Razors Customs

Kenyan automotive upholstery and vehicle interior transformation booking platform. Customers can browse services, customise seat builds, book appointment slots, and pay deposits via Safaricom M-Pesa (Daraja STK Push); the workshop manages bookings, work orders, inventory, invoicing, and staff through an admin dashboard.

## Stack

- **Frontend** — React 19, Vite 6, Tailwind CSS v4, Motion
- **Backend** — Express 4 (node), TypeScript, Zod validation
- **Database** — PostgreSQL via Prisma (Neon in production; Docker Postgres for local dev)
- **Auth** — Clerk (`AUTH_PROVIDER=clerk`) with a legacy password/JWT fallback (`legacy`) for local development and rollback
- **Payments** — Safaricom Daraja Lipa Na M-Pesa Online (STK Push), verify-then-apply callbacks
- **Infra** — Vercel (serverless) or Docker; Sentry error tracking; Upstash Redis for distributed rate limiting
- **CI/E2E** — GitHub Actions + Playwright (Chromium)

## Getting started

Prerequisites: Node 20+, npm, and Docker (for the local Postgres).

```bash
npm ci                       # install lockfile-resolved dependencies
cp .env.example .env         # then fill in the values (see .env.example comments)
docker compose up -d postgres
npm run db:migrate           # apply Prisma migrations
npm run db:seed              # seed users, services, CRM data, and inventory
npm run dev                  # start the Express + Vite dev server on http://localhost:3000
```

Without a local Postgres, the app also runs against an in-memory JSON mock (`DATABASE_ENGINE=mock` — the default outside production). Production **requires** `DATABASE_ENGINE=postgres`.

## Scripts

| Command                 | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Start the full-stack dev server on port 3000         |
| `npm run build`         | Build the Vite client + bundle the server             |
| `npm start`             | Run the production bundle (`dist/server.cjs`)         |
| `npm run typecheck`     | TypeScript validation (no emit)                      |
| `npm run lint`          | Alias for `npm run typecheck`                        |
| `npm run format`        | Prettier on `src/**` and `server/**`                 |
| `npm run db:migrate`    | Create/apply a Prisma migration                      |
| `npm run db:seed`       | Seed the database                                    |
| `npm run db:studio`     | Open Prisma Studio                                   |
| `npm run db:reset`      | Destructive local reset + reseed                     |
| `npm run test:e2e`      | Run the Playwright suite                             |
| `npm run test:e2e:ui`   | Run Playwright with the UI runner                    |

## Architecture

- `src/` — React app: public marketing site, booking wizard, customer dashboard, admin dashboard.
- `server/` — Express API. `server/app.ts` is the shared app module (used by both the local entry `server.ts` and the Vercel serverless handler `api/index.ts`).
- `server/db.ts` — persistence boundary mapping Prisma records to frontend domain types. Use it instead of ad-hoc Prisma access in route handlers.
- `prisma/schema.prisma` — PostgreSQL schema. Schema changes require a migration.
- `server/casbin/` — ABAC/RBAC policy layer for privileged admin actions.
- `e2e/` — Playwright end-to-end specs (auth, bookings, data integrity, M-Pesa).

The backend is authoritative for identity and role in both auth modes: customer ownership and admin access are enforced server-side, never trusted from client state.

## Environment variables

Copy `.env.example` and set these groups:

- **Auth** — `AUTH_PROVIDER` (`clerk` recommended). With Clerk: `CLERK_SECRET_KEY` (server-only, never `VITE_`-prefixed), plus optional `CLERK_AUTHORIZED_PARTY` and `ADMIN_CLERK_IDS`. With legacy: a strong `AUTH_SECRET` (32+ chars) and admin credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD` as a bcrypt hash in production).
- **Database** — `DATABASE_URL`, `DATABASE_ENGINE=postgres` in production, optional `DATABASE_SSL`.
- **M-Pesa** — `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, `MPESA_ENVIRONMENT` (`sandbox` | `production`), `MPESA_CALLBACK_SECRET`, and `APP_URL` (the public origin used as the Daraja `CallBackURL`).
- **Rate limiting** — `RATE_LIMIT_STORE=upstash` in production requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The `memory` store resets per process and is only suitable for local development.
- **Observability** — `SENTRY_DSN` (server) and `VITE_SENTRY_DSN` (client). Unset by default; error tracking activates automatically when a DSN is present.
- **Hardening** — `CORS_ORIGIN` (comma-separated; required in production), optional `ADMIN_IP_ALLOWLIST`, `IMAGE_CDN_URL`.

The env config (`server/env.ts`) is fail-closed: production startup throws on missing required variables, weak/plaintext admin passwords, and mock storage.

Client-safe variables must use the `VITE_` prefix. Server secrets (`CLERK_SECRET_KEY`, auth secrets, M-Pesa credentials, callback secret) must never be bundled or committed.

## Deployment

### Vercel + Neon (recommended)

1. Provision a Neon (or any managed) PostgreSQL instance and run `npx prisma migrate deploy` + `npx prisma db seed` against it.
2. Set the production environment variables above in the Vercel project settings (including `NODE_ENV=production`, `DATABASE_ENGINE=postgres`, `AUTH_PROVIDER=clerk`, `RATE_LIMIT_STORE=upstash`, `APP_URL`, and `CORS_ORIGIN`).
3. Deploy; `vercel.json` routes all non-API traffic to the `api/index.ts` serverless handler.

### Docker

`docker compose up --build` runs Postgres plus the app container (healthchecked, migrations applied on boot).

## Security posture

- Strict production CSP (Helmet), HSTS, `frame-ancestors 'none'`
- Per-route rate limiting, distributed via Upstash in production
- Token revocation denylist that fails closed on store errors
- Zod validation on all structured payloads
- Casbin policies on privileged admin endpoints + an administrative audit log
- M-Pesa callbacks are authenticated with a shared secret **and** verified against Daraja before any payment is applied; STK amounts are checked against the booking/invoice server-side
- No secrets in the repository; `.env*` and test artifacts are gitignored

## Testing

```bash
npm run test:e2e           # requires the dev server (Playwright boots it automatically)
npx playwright test e2e/auth.spec.ts
```

The E2E suite runs against the legacy auth provider by default and raises rate limits for parallel execution. CI runs migrations, typecheck, build, and the full Playwright suite on push/PR.

## Documentation

- [`docs/CLERK_SETUP.md`](docs/CLERK_SETUP.md) — Clerk setup and configuration notes.
- `.github/copilot-instructions.md` — extended build/convention guidance for contributors.