import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { registerCustomer, loginAdmin, TEST_PASSWORD, uniqueAppointment } from "./helpers";

/**
 * Admin bootstrap + staff lifecycle coverage (legacy auth):
 *   - bootstrap endpoint is disabled without BOOTSTRAP_TOKEN and rejects bad tokens
 *   - owner creates staff → one-time temporary passcode + `invited` status
 *   - first sign-in with the temp passcode sets mustChangePassword
 *   - change-password: wrong current 401, success flips flag, activates the row,
 *     kills the old token, and the temp passcode stops working
 *   - self-deactivation is forbidden (403) and an owner cannot be demoted by a manager
 *   - deactivation revokes live sessions and blocks sign-in; reactivation restores it
 *   - role-scoped Casbin parity: craftsman can create bookings but not confirm them,
 *     and cannot read the staff/customers threads
 *
 * Runs against whichever engine is configured (Postgres in CI, mock locally).
 * Each test mints its own fresh staff member + request context so specs stay
 * parallel-safe; the shared owner login is independent of member accounts.
 */

function uniqueStaff() {
  const stamp = Date.now().toString();
  return {
    phone: `07${Math.floor(10000000 + Math.random() * 90000000)}`,
    email: `staff-${stamp}-${Math.floor(Math.random() * 1000)}@rollingrazors.co.ke`,
  };
}

/** Creates a staff member as the owner; returns the row + the one-time passcode. */
async function createStaffAsOwner(ctx: APIRequestContext, role: string) {
  const { phone, email } = uniqueStaff();
  const res = await ctx.post("/api/staff", {
    data: { name: `E2E ${role}`, phone, email, role, specialty: "E2E suite" },
  });
  const raw = await res.text();
  expect(res.ok(), `staff create failed (${res.status()}): ${raw}`).toBeTruthy();
  const body = JSON.parse(raw);
  return { staff: body.staff as { id: string; role: string; status: string; phone: string; email: string }, temp: body.temporaryPassword as string, phone, email };
}

/**
 * Signs a freshly-created staff member in with their one-time passcode and
 * immediately changes it to TEST_PASSWORD. Since the server gates every
 * authenticated route behind a 403 until mustChangePassword clears, this is a
 * required prerequisite for acting with the member's session.
 */
async function loginStaffAndSetPassword(ctx: APIRequestContext, email: string, temp: string) {
  const login = await ctx.post("/api/auth/admin/login", { data: { identifier: email, password: temp } });
  expect(login.status(), `staff login with temp passcode failed: ${await login.text()}`).toBe(200);
  const changed = await ctx.post("/api/auth/change-password", {
    data: { currentPassword: temp, newPassword: TEST_PASSWORD },
  });
  expect(changed.status(), `change-password on first login failed: ${await changed.text()}`).toBe(200);
  const body = await changed.json();
  expect(body.user.mustChangePassword).toBe(false);
  return { loginBody: await login.json(), changedBody: body };
}

test.describe("Admin bootstrap & staff lifecycle", () => {
  test("bootstrap endpoint refuses requests without a valid server token", async ({ request }) => {
    // In the test environment BOOTSTRAP_TOKEN is unset, so the endpoint is
    // disabled: both a missing header and a bogus token must be rejected 403
    // (a fresh-install 409 is unreachable here because the token gate runs first).
    const noHeader = await request.post("/api/admin/bootstrap", {
      data: { name: "Boot", email: "boot@rollingrazors.co.ke", phone: "0711000001" },
    });
    expect(noHeader.status()).toBe(403);
    expect((await noHeader.json()).error).toMatch(/bootstrap token/i);

    const badToken = await request.post("/api/admin/bootstrap", {
      headers: { "x-bootstrap-token": "bogus-token" },
      data: { name: "Boot", email: "boot@rollingrazors.co.ke", phone: "0711000001" },
    });
    expect(badToken.status()).toBe(403);
    expect((await badToken.json()).error).toMatch(/bootstrap token/i);

    // When a server-level BOOTSTRAP_TOKEN is configured (fresh-install test
    // harness), a valid token against an already-set-up server is refused 409.
    if (process.env.BOOTSTRAP_TOKEN) {
      const existingOwner = await request.post("/api/admin/bootstrap", {
        headers: { "x-bootstrap-token": process.env.BOOTSTRAP_TOKEN },
        data: { name: "Boot", email: "boot@rollingrazors.co.ke", phone: "0711000001" },
      });
      expect(existingOwner.status()).toBe(409);
      expect((await existingOwner.json()).error).toMatch(/already set up|fresh installation/i);
    }
  });

  test("created staff sign in with a temp passcode and must change it on first login", async ({ playwright }) => {
    const owner = await playwright.request.newContext();
    await loginAdmin(owner);

    const { staff, temp } = await createStaffAsOwner(owner, "craftsman");
    expect(staff.status).toBe("invited");
    expect(staff.role).toBe("craftsman");

    // First sign-in with the temporary passcode
    const member = await playwright.request.newContext();
    const login = await member.post("/api/auth/admin/login", { data: { identifier: staff.email, password: temp } });
    expect(login.status(), `temp-passcode login failed: ${await login.text()}`).toBe(200);
    const loginBody = await login.json();
    expect(loginBody.user.mustChangePassword).toBe(true);

    const freshPassword = randomBytes(24).toString("base64url");
    // Wrong current passcode is rejected before any change happens
    const wrongCurrent = await member.post("/api/auth/change-password", {
      data: { currentPassword: randomBytes(24).toString("base64url"), newPassword: freshPassword },
    });
    expect(wrongCurrent.status()).toBe(401);
    expect((await wrongCurrent.json()).error).toMatch(/incorrect/i);

    // Change to a fresh test-only password: flag clears, directory row activates, new token issued
    const changed = await member.post("/api/auth/change-password", {
      data: { currentPassword: temp, newPassword: freshPassword },
    });
    expect(changed.status(), `change-password failed: ${await changed.text()}`).toBe(200);
    expect((await changed.json()).user.mustChangePassword).toBe(false);

    // The pre-change token is revoked → 401 on a staff-scoped call via Authorization header
    const oldGet = await (await playwright.request.newContext()).get("/api/bookings", { headers: { Authorization: `Bearer ${loginBody.token}` } });
    expect(oldGet.status()).toBe(401);

    // Temp passcode no longer works; the new one does (flag now false)
    const staleTemp = await (await playwright.request.newContext()).post("/api/auth/admin/login", { data: { identifier: staff.email, password: temp } });
    expect(staleTemp.status()).toBe(401);

    const fresh = await playwright.request.newContext();
    const freshLogin = await fresh.post("/api/auth/admin/login", { data: { identifier: staff.email, password: freshPassword } });
    expect(freshLogin.status(), `new-password login failed: ${await freshLogin.text()}`).toBe(200);
    expect((await freshLogin.json()).user.mustChangePassword).toBe(false);

    // Owner sees the row flipped to active
    const list = await (await owner.get("/api/staff")).json();
    expect((list.staff as any[]).find((s: any) => s.id === staff.id)?.status).toBe("active");
  });

  test("self-deactivation is forbidden; manager cannot create staff or touch the owner row", async ({ playwright }) => {
    const owner = await playwright.request.newContext();
    await loginAdmin(owner);

    const { staff: manager, temp: managerTemp } = await createStaffAsOwner(owner, "manager");

    const mgr = await playwright.request.newContext();
    await loginStaffAndSetPassword(mgr, manager.email, managerTemp);

    // A manager cannot demote an owner…
    const list = await (await mgr.get("/api/staff")).json();
    const ownerRow = (list.staff as any[]).find((s: any) => s.role === "owner")!;
    expect(ownerRow, "expected at least one owner on staff directory").toBeTruthy();
    const demote = await mgr.patch(`/api/staff/${ownerRow.id}`, { data: { role: "manager" } });
    expect(demote.status()).toBe(403);
    expect((await demote.json()).error).toMatch(/owner/i);

    // …cannot deactivate the owner…
    const deactOwner = await mgr.post(`/api/staff/${ownerRow.id}/deactivate`);
    expect(deactOwner.status()).toBe(403);

    // …cannot create staff (staff:create is owner-only)…
    const mgrCreate = await mgr.post("/api/staff", {
      data: { name: "Sneaky", phone: "0711000999", email: "sneaky@rollingrazors.co.ke", role: "craftsman" },
    });
    expect(mgrCreate.status()).toBe(403);

    // …and cannot deactivate their own account
    const selfDeact = await mgr.post(`/api/staff/${manager.id}/deactivate`);
    expect(selfDeact.status()).toBe(403);
    expect((await selfDeact.json()).error).toMatch(/own account/i);
  });

  test("deactivation revokes live sessions and blocks sign-in; reactivation restores access", async ({ playwright }) => {
    const owner = await playwright.request.newContext();
    await loginAdmin(owner);

    const { staff: manager, temp: managerTemp } = await createStaffAsOwner(owner, "manager");

    const mgr = await playwright.request.newContext();
    const { changedBody } = await loginStaffAndSetPassword(mgr, manager.email, managerTemp);
    const token = changedBody.token as string;
    expect((await mgr.get("/api/staff")).status()).toBe(200);

    // Owner deactivates the manager
    const deact = await owner.post(`/api/staff/${manager.id}/deactivate`);
    expect(deact.status(), `deactivate failed: ${await deact.text()}`).toBe(200);
    expect((await deact.json()).staff.status).toBe("deactivated");

    // Live token is killed immediately
    const live = await mgr.get("/api/staff");
    expect(live.status(), `deactivated live session should 401, got ${live.status()}`).toBe(401);

    // Re-login is refused while deactivated
    const blocked = await (await playwright.request.newContext()).post("/api/auth/admin/login", { data: { identifier: manager.email, password: managerTemp } });
    expect(blocked.status()).toBe(403);
    expect((await blocked.json()).error).toMatch(/deactivated/i);

    // Reactivation restores sign-in (the member is now on their real password;
    // the forced-change flag cleared when they changed it, and reactivation
    // does not touch it)
    const react = await owner.post(`/api/staff/${manager.id}/reactivate`);
    expect(react.status(), `reactivate failed: ${await react.text()}`).toBe(200);
    const back = await (await playwright.request.newContext()).post("/api/auth/admin/login", { data: { identifier: manager.email, password: TEST_PASSWORD } });
    expect(back.status(), `post-reactivation login failed: ${await back.text()}`).toBe(200);
    expect((await back.json()).user.mustChangePassword).toBe(false);

    // A stale pre-deactivation token is still revoked by the marker
    const staleGet = await (await playwright.request.newContext()).get("/api/staff", { headers: { Authorization: `Bearer ${token}` } });
    expect(staleGet.status()).toBe(401);
  });

  test("customer (driver) credentials are rejected at the staff-only sign-in", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const customer = await registerCustomer(ctx);

    const staffLogin = await ctx.post("/api/auth/admin/login", {
      data: { identifier: customer.phone, password: TEST_PASSWORD },
    });
    expect(staffLogin.status()).toBe(403);
    expect(await staffLogin.text()).toMatch(/staff-only sign-in/i);
  });

  test("craftsman scope: may create bookings but cannot confirm or read staff/customers", async ({ playwright }) => {
    const owner = await playwright.request.newContext();
    await loginAdmin(owner);
    const { staff: craftsman, temp } = await createStaffAsOwner(owner, "craftsman");

    const customerCtx = await playwright.request.newContext();
    const customer = await registerCustomer(customerCtx);

    const member = await playwright.request.newContext();
    await loginStaffAndSetPassword(member, craftsman.email, temp);

    // Can create a booking (bookings:create)…
    const { appointmentDate, appointmentTime } = uniqueAppointment();
    const booked = await member.post("/api/bookings", {
      data: {
        customerId: customer.user.id,
        customerName: "E2E Craftsman",
        customerPhone: customer.phone,
        customerEmail: customer.email,
        serviceId: "srv-1",
        serviceName: "Car Upholstery",
        vehicleDetails: { type: "Car", make: "Toyota", model: "Probox", year: 2019, registrationNo: `KBE ${Math.floor(100 + Math.random() * 900)}M` },
        appointmentDate,
        appointmentTime,
        locationType: "workshop",
        estimatedPrice: 12000,
        depositAmount: 4000,
        status: "pending",
        privacyAccepted: true,
        termsAccepted: true,
      },
    });
    expect(booked.status(), `craftsman booking create failed: ${await booked.text()}`).toBe(201);
    const bookingId = ((await booked.json()).booking as { id: string }).id;

    // …but confirming requires bookings:confirm (owner/manager/receptionist)
    const confirm = await member.patch(`/api/bookings/${bookingId}`, { data: { status: "confirmed" } });
    expect(confirm.status()).toBe(403);

    // …and the workshop threads are out of scope
    expect((await member.get("/api/customers")).status()).toBe(403);
    expect((await member.get("/api/staff")).status()).toBe(403);
  });
});