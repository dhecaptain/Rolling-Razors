# Clerk Authentication Setup

Rolling Razors supports two authentication providers, selected by `AUTH_PROVIDER`:

| Provider | When | Identity source |
| --- | --- | --- |
| `legacy` | default today / rollback | Custom HS256 JWT + phone OTP (existing) |
| `clerk` | target production | Clerk (session JWT verified server-side) |

If `AUTH_PROVIDER` is unset, the server auto-detects: **Clerk when `CLERK_SECRET_KEY` is present, otherwise legacy**.
The frontend mirrors this via `VITE_CLERK_PUBLISHABLE_KEY` / `VITE_AUTH_PROVIDER`.

> Authentication is enforced **server-side on every protected request**. The frontend never proves identity by itself, and no client value (localStorage, body, query) is trusted for role.

---

## 1. Clerk Dashboard configuration

1. Create a Clerk application at <https://dashboard.clerk.com>.
2. **User & Authentication → Email, Phone, Username**
   - Enable **Phone number** (Kenyan numbers) — recommended, since the business is phone/M-Pesa first.
   - Optionally enable **Email address** as a secondary identifier.
   - Choose verification strategy (SMS OTP is the closest match to the current flow).
3. **Sessions → Customize session token**: ensure `publicMetadata` is available if you want role checks to avoid a backend lookup. (The backend also falls back to the Clerk Backend API, cached 60s, so this is optional.)
4. Create the workshop admin account (invite or sign up), then open the user and set **Public metadata**:
   ```json
   { "role": "admin" }
   ```
   Customers must **not** have `role: admin`.
5. Copy the keys from **API Keys**:
   - `VITE_CLERK_PUBLISHABLE_KEY` = `pk_test_…` / `pk_live_…` (client-safe)
   - `CLERK_SECRET_KEY` = `sk_test_…` / `sk_live_…` (**server-only secret**)
6. Optional: configure a custom domain (e.g. `clerk.rollingrazors.co.ke`) and set `CLERK_AUTHORIZED_PARTY` to the app origin(s).

---

## 2. Environment variables

### Client-safe (Vite — bundled into the frontend)
```dotenv
VITE_CLERK_PUBLISHABLE_KEY="pk_test_…"
# optional: force "clerk" or "legacy" on the frontend
VITE_AUTH_PROVIDER=""
```

### Server-only (NEVER prefix with `VITE_`)
```dotenv
AUTH_PROVIDER="clerk"
CLERK_SECRET_KEY="sk_test_…"
# optional hardening
CLERK_AUTHORIZED_PARTY=""
ADMIN_CLERK_IDS="user_2abc,user_2def"
```

Never commit real keys. `.env` is git-ignored; use your host's secret manager in production.

---

## 3. What the backend does

- `clerkMiddleware()` is mounted on `/api` **only when** `AUTH_PROVIDER=clerk`.
- Every protected route uses `authenticate`, which resolves to:
  - Clerk path: `getAuth(req)` → verifies the bearer session JWT against Clerk's JWKS (issuer/`azp`/expiry), returns **401** if absent/invalid.
  - Role is derived from Clerk `publicMetadata.role` (server-side; cached 60s). `ADMIN_CLERK_IDS` can additionally allow-list admins.
  - The app profile is lazily synced into Postgres keyed by `User.clerkId` (falling back to a phone/email match to link existing accounts). Missing profiles are created.
  - `requireAdmin` then enforces **403** for authenticated non-admins.
- Legacy auth endpoints (`/api/auth/customer/*`, `/api/auth/admin/*`, `/api/auth/verify`) return **404** in Clerk mode, so they cannot be used as a bypass. `/api/auth/logout` clears the legacy cookie; Clerk sessions end client-side via `signOut()`.

### Identity model
- Clerk owns authentication identity. `User.clerkId` stores the Clerk `sub`.
- Postgres keeps application data only: profile, `role` (mirrored cache), phone, saved vehicles, bookings, invoices.
- Bookings/vehicles/invoices keep referencing the application `User`/`Customer` ids.

---

## 4. Enabling / rolling back

**Enable Clerk**
1. Set `AUTH_PROVIDER=clerk`, `CLERK_SECRET_KEY=sk_…`, and `VITE_CLERK_PUBLISHABLE_KEY=pk_…`.
2. Deploy. Verify `/api/health` reports `"authProvider":"clerk"`.
3. Sign in as the admin Clerk user; confirm `/api/customers` succeeds (admin) and a normal customer gets 403.

**Roll back**
Set `AUTH_PROVIDER=legacy` (and `VITE_AUTH_PROVIDER=legacy`) and redeploy. The schema change (`User.clerkId`, nullable phone/email) is additive and backward compatible.

---

## 5. End-to-end tests in Clerk mode

The Playwright suite runs against `AUTH_PROVIDER=legacy` by default (see `playwright.config.ts`), which is why CI needs no Clerk secrets. Tests that require an authenticated identity are skipped when the provider is Clerk.

To run E2E against Clerk you need a **dedicated Clerk test instance** (never production):

1. Install `@clerk/testing` and a test user in the test instance with `publicMetadata.role="admin"`.
2. Export `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` and `E2E_CLERK_USER_*` credentials to the test runner.
3. Run with `AUTH_PROVIDER=clerk npx playwright test`.
4. The current specs branch on `/api/health.authProvider`; add Clerk sign-in via `@clerk/testing` helpers for full coverage.

Without a Clerk test instance, the following are still verified in legacy mode and share the same authorization boundary: unauthorized **401**, malformed/forged token **401**, authenticated non-admin **403**, and admin privileged operations.

---

## 6. Clerk CLI (link + key sync)

This repo is linked to the Clerk application **`app_3JAoT6I6lYJYpEgGmkbnDJBlqgG`** ("Rolling-Razors").

```bash
clerk auth login                 # browser OAuth
clerk init --app app_3JAoT6I6lYJYpEgGmkbnDJBlqgG   # link + write keys to .env
clerk env pull --file .env       # refresh keys, or --instance prod for production
clerk doctor                     # health-check the integration
```

Notes:
- `clerk init` writes the client-safe key as **`VITE_CLERK_PUBLISHABLE_KEY`** and the secret as `CLERK_SECRET_KEY`. The server mirrors `VITE_CLERK_PUBLISHABLE_KEY` → `CLERK_PUBLISHABLE_KEY` at boot (`server/env.ts`) because `@clerk/express` reads the latter.
- The frontend SDK is **`@clerk/react`** (v6, new generation). Do not add `@clerk/clerk-react`; the two must not be mixed.
- `clerk init` may detect `bun` from the stray `bun.lock`. This project is **npm-based** (CI uses `npm ci`); if the CLI skips installing the SDK, run `npm install @clerk/react`.

