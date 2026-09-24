# Workshop Owner Bootstrap & Staff Access

Rolling Razors uses a **granular staff role model** (`owner`, `manager`, `craftsman`,
`receptionist`) enforced server-side with **Casbin** (`server/casbin/policy.csv`).
On a fresh installation there is no workshop account — the first owner is created
through a one-time **bootstrap endpoint**.

## 1. Bootstrap the first owner

1. Set a strong `BOOTSTRAP_TOKEN` in your environment (e.g. `openssl rand -hex 24`).
   The endpoint is **disabled** when it is empty (a production server warns).
2. With the server running, call:

   ```bash
   curl -X POST http://localhost:3000/api/admin/bootstrap \
     -H 'Content-Type: application/json' \
     -H 'x-bootstrap-token: <BOOTSTRAP_TOKEN>' \
     -d '{"name":"Alice Owner","email":"alice@rollingrazors.co.ke","phone":"+254711000111"}'
   ```

3. The response returns a **one-time temporary passcode** (`temporaryPassword`),
   the new owner user, and a signed token. Share the passcode with the owner over
   a secure channel (WhatsApp/phone).

Constraints:
- Guarded by the `x-bootstrap-token` header; returns `403` without it.
- `409` if any `owner`/`manager` account already exists, or the phone/email is
  already in the directory.

## 2. First sign-in forces a password change

The bootstrap account (and any staff created via `POST /api/staff`) starts with
`mustChangePassword = true` and directory status `invited`.

The front-end shows a **blocking modal** (`ForcePasswordChangeModal`) until the
staff member calls:

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"currentPassword":"<temp>","newPassword":"<new-password>"}'
```

This verifies the current passcode, writes a bcrypt hash, clears
`mustChangePassword`, flips `invited -> active`, **revokes every prior session**
for that user, and returns a fresh token/cookie.

## 3. Staff directory (role RBAC)

| Endpoint | Method | Guard |
| --- | --- | --- |
| `/api/staff` | GET | any staff role (`staff:read`) |
| `/api/staff` | POST | `staff:create` — owner only |
| `/api/staff/:id` | PATCH | staff role with `staff:update` (owner/manager) |
| `/api/staff/:id/deactivate` | POST | owner/manager; owner-row only by owner; never self |
| `/api/staff/:id/reactivate` | POST | owner/manager; owner-row only by owner |

Role restrictions enforced in code on top of Casbin:
- Only the **owner** can create/assign or change the `owner` role.
- A staff member cannot deactivate **themselves** (`403`).
- Only the owner can deactivate another owner.
- New staff are created with a temporary passcode (returned once) and status
  `invited` until their first password change.

Deactivation is **soft**: the directory row is kept with `status = deactivated`
and a per-user **revocation marker** is set (`rr:revoke:user:<id>`, 7-day TTL).
Existing JWTs signed before the marker are rejected (`401`), and further sign-ins
return `403` until the member is reactivated.

## 4. Role → workspace scope (frontend)

`src/components/admin/AdminDashboard.tsx` mirrors the Casbin policy:

- **owner / manager** — Overview, Kanban, Bookings, Schedule, Services, Customers,
  Staff, M-Pesa.
- **craftsman** — Work Order Kanban + Bookings.
- **receptionist** — Bookings + Customers.

The `Confirm booking` action is hidden for roles without `bookings:confirm`
(craftsman). All routes still enforce RBAC server-side; the UI only hides what
the backend would reject.

## 5. Legacy auth vs Clerk

- Legacy mode (`AUTH_PROVIDER=legacy`): the flows above apply end-to-end.
- Clerk mode: staff identities resolve through Clerk. Directory `status =
  deactivated` and the revoke marker still apply in `requireClerkAuth`
  (`server/app.ts`). Legacy `"admin"` metadata is remapped to `owner`.

## Developer notes

- Revocation compares a token's `iatms` (ms) claim against the marker, so a token
  minted just before a password change / deactivation is revoked immediately
  while a newer one survives — no second-granularity window. Pre-`iatms` tokens
  fall back to the JWT `iat` second boundary.
- Mock DB (`data/rolling_razors_db.json`) normalises legacy roles the same way
  as the Postgres migration (`admin -> owner`, lowercase staff roles, `status`,
  `email`, `userId` links) — run `prisma/seed.ts` (`DATABASE_ENGINE=postgres`)
  or the mock normalisation to keep engines in sync.