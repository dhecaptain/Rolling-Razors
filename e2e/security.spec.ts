import { test, expect } from "@playwright/test";
import crypto from "crypto";
import { registerCustomer, authHeaders, getAuthProvider, uniqueAppointment, TestCustomer } from "./helpers";

// Values mirror playwright.config.ts webServer env (test fixtures, not secrets).
const ADMIN_EMAIL = "ci@rollingrazors.co.ke";
const ADMIN_PASSWORD = "ci-test-pass";
const TEST_SECRET = "test-secret-32chars-long-for-ci-only";

/** Signs a JWT with the test secret but an already-expired `exp` claim. */
function expiredToken(user: { id: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      id: user.id,
      name: "Expired Tester",
      email: "expired@test.ke",
      phone: "0712000000",
      role: "customer",
      iss: "rolling-razors-kenya",
      aud: "rolling-razors-app",
      jti: crypto.randomUUID(),
      iat: now - 7200,
      exp: now - 3600,
    })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", TEST_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

async function adminLogin(request: import("@playwright/test").APIRequestContext | import("@playwright/test").APIRequestContext) {
  const res = await request.post("/api/auth/admin/login", {
    data: { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(res.ok(), `admin login failed (${res.status()})`).toBeTruthy();
  const body = await res.json();
  expect(body.token, "admin login did not return a token").toBeTruthy();
  return body.token as string;
}

type BrowserRequest = import("@playwright/test").APIRequestContext;

/** Seeds localStorage with a legacy session and reloads so the SPA boots from it. */
async function seedSession(page: import("@playwright/test").Page, session: Record<string, unknown>) {
  await page.goto("/");
  await page.evaluate((value) => {
    localStorage.setItem("rr_auth_session", JSON.stringify(value));
  }, session);
  await page.reload();
}

function sessionFor(customer: TestCustomer, overrides: Record<string, unknown> = {}) {
  return {
    user: { ...customer.user, ...overrides },
    token: customer.token,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
}

async function adminSessionValue(request: BrowserRequest) {
  const token = await adminLogin(request);
  return {
    user: {
      id: "staff-admin",
      name: "CI Admin",
      phone: "+254 712 345 678",
      email: ADMIN_EMAIL,
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      location: "Workshop HQ, Nairobi",
    },
    token,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  };
}

test.describe("Authorization boundary (browser)", () => {
  test("customer cannot access staff Workshop Hub", async ({ page, request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy browser flow required for this security test (see docs/CLERK_SETUP.md)");

    const customer = await registerCustomer(request);
    await seedSession(page, sessionFor(customer));

    // Navbar must show the customer dashboard link, never workshop-admin branding.
    await expect(page.locator("#header-active-dashboard-link-btn")).toBeVisible();
    await expect(page.locator("#header-active-dashboard-link-btn")).toContainText("Driver garage");
    await expect(page.locator("#header-active-dashboard-link-btn")).not.toContainText("Workshop hub");
    // No staff entry is exposed to a logged-in driver.
    await expect(page.locator("#nav-workshop-staff-btn")).toHaveCount(0);
    // The admin dashboard must never render.
    await expect(page.locator("#admin-dashboard-container")).toHaveCount(0);
  });

  test("localStorage role tampering does NOT elevate a customer to staff", async ({ page, request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy browser flow required for this security test");

    const customer = await registerCustomer(request);
    // Attacker flips role=admin in the stored session, keeping the real customer token.
    await seedSession(page, sessionFor(customer, { role: "admin" }));

    await expect(page.locator("#admin-dashboard-container")).toHaveCount(0);
    // Server re-verification downgraded the account: the driver UI is preserved.
    await expect(page.locator("#header-active-dashboard-link-btn")).toContainText("Driver garage");
    await expect(page.locator("#header-active-dashboard-link-btn")).not.toContainText("Workshop hub");
    // Navbar staff entry must not appear even though localStorage claimed admin.
    await expect(page.locator("#nav-workshop-staff-btn")).toHaveCount(0);
  });

  test("staff can access Workshop Hub and authorized APIs", async ({ page, request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy browser flow required for this security test");

    await seedSession(page, await adminSessionValue(request));

    await expect(page.locator("#header-active-dashboard-link-btn")).toContainText("Workshop hub");
    await page.locator("#header-active-dashboard-link-btn").click();
    await expect(page.locator("#admin-dashboard-container")).toBeVisible();

    const token = await adminLogin(request);
    const customers = await request.get("/api/customers?page=1&limit=1", { headers: authHeaders(token) });
    expect(customers.status()).toBe(200);
    const lowStock = await request.get("/api/inventory/low", { headers: authHeaders(token) });
    expect(lowStock.status()).toBe(200);
  });

  test("refresh preserves the correct (customer) role", async ({ page, request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy browser flow required for this security test");

    const customer = await registerCustomer(request);
    await seedSession(page, sessionFor(customer, { role: "admin" }));

    await page.reload();
    await expect(page.locator("#header-active-dashboard-link-btn")).toContainText("Driver garage");
    await expect(page.locator("#admin-dashboard-container")).toHaveCount(0);
  });

  test("customer cannot escalate by URL/hash direct admin navigation", async ({ page, request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy browser flow required for this security test");

    const customer = await registerCustomer(request);
    await seedSession(page, sessionFor(customer));

    await page.goto("/#admin_dashboard");
    await expect(page.locator("#admin-dashboard-container")).toHaveCount(0);
    await expect(page.locator("#header-active-dashboard-link-btn")).toContainText("Driver garage");

    await page.goto("/?view=admin_dashboard#admin-dashboard");
    await expect(page.locator("#admin-dashboard-container")).toHaveCount(0);
    await expect(page.locator("#header-active-dashboard-link-btn")).toContainText("Driver garage");

    await page.goto("/admin");
    await expect(page.locator("#admin-dashboard-container")).toHaveCount(0);
    await expect(page.locator("#header-active-dashboard-link-btn")).toContainText("Driver garage");
  });

  test("logout removes access to authenticated views", async ({ page, request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy browser flow required for this security test");

    await seedSession(page, await adminSessionValue(request));

    await page.locator("#user-profile-menu-btn").click();
    await expect(page.locator("#auth-profile-dropdown")).toBeVisible();
    await page.locator("#navbar-signout-btn").click();

    // Back to anonymous website: staff login entry returns, admin hub gone.
    await expect(page.locator("#nav-driver-signin-btn")).toBeVisible();
    await expect(page.locator("#header-active-dashboard-link-btn")).toHaveCount(0);
    await expect(page.locator("#admin-dashboard-container")).toHaveCount(0);
  });
});

test.describe("Authorization boundary (API)", () => {
  test("unauthenticated user gets 401 on protected and admin endpoints", async ({ request }) => {
    const admin = await request.get("/api/customers?page=1&limit=1");
    expect(admin.status()).toBe(401);
    const bookings = await request.get("/api/bookings?page=1&limit=1");
    expect(bookings.status()).toBe(401);
    const inventory = await request.get("/api/inventory/low");
    expect(inventory.status()).toBe(401);
  });

  test("customer gets 403 on staff endpoints", async ({ request }) => {
    const { token } = await registerCustomer(request);
    for (const url of ["/api/customers?page=1&limit=1", "/api/inventory/low", "/api/staff", "/api/audit-logs?limit=5"]) {
      const res = await request.get(url, { headers: authHeaders(token) });
      expect(res.status(), `${url} should be 403 for customer (got ${res.status()})`).toBe(403);
    }
  });

  test("customer cannot modify role via API payload", async ({ request }) => {
    const customer = await registerCustomer(request);
    const reg = `KRP ${Math.floor(100 + Math.random() * 900)}X`;
    // Inject role=admin in a writable payload. The server must ignore/drop it.
    const res = await request.post("/api/vehicles", {
      headers: authHeaders(customer.token),
      data: {
        customerId: customer.user.id,
        type: "Car",
        make: "Toyota",
        model: "Harrier",
        year: 2020,
        registrationNo: reg,
        role: "admin",
      },
    });
    expect(res.ok(), `vehicle create with role payload failed (${res.status()})`).toBeTruthy();
    // The token is still a customer token: admin endpoints remain 403.
    const admin = await request.get("/api/customers?page=1&limit=1", { headers: authHeaders(customer.token) });
    expect(admin.status()).toBe(403);
  });

  test("customer cannot read another customer's resource (IDOR)", async ({ request }) => {
    const customerA = await registerCustomer(request);
    const customerB = await registerCustomer(request);
    const regA = `KIA ${Math.floor(100 + Math.random() * 900)}X`;

    // A creates a vehicle and a booking (which also creates a work order).
    await request.post("/api/vehicles", {
      headers: authHeaders(customerA.token),
      data: { customerId: customerA.user.id, type: "Car", make: "Toyota", model: "Corolla", year: 2019, registrationNo: regA },
    });
    const { appointmentDate, appointmentTime } = uniqueAppointment();
    await request.post("/api/bookings", {
      headers: authHeaders(customerA.token),
      data: {
        customerName: "User A",
        customerPhone: customerA.phone,
        customerEmail: customerA.email,
        serviceId: "srv-1",
        serviceName: "Car Upholstery",
        vehicleDetails: { type: "Car", make: "Toyota", model: "Corolla", year: 2019, registrationNo: regA },
        appointmentDate,
        appointmentTime,
        locationType: "workshop",
        estimatedPrice: 18000,
        depositAmount: 6300,
        status: "pending",
      },
    });

    // B's listings must be scoped to B only.
    const bVehicles = await request.get("/api/vehicles?page=1&limit=100", { headers: authHeaders(customerB.token) });
    const bVBody = await bVehicles.json();
    expect(bVBody.vehicles.some((v: any) => v.registrationNo.includes(regA.split(" ")[1]))).toBe(false);

    const bBookings = await request.get("/api/bookings?page=1&limit=100", { headers: authHeaders(customerB.token) });
    const bBBody = await bBookings.json();
    expect(bBBody.bookings.every((b: any) => b.customerId !== customerA.user.id)).toBe(true);

    const bOrders = await request.get("/api/work-orders?page=1&limit=100", { headers: authHeaders(customerB.token) });
    const bWBody = await bOrders.json();
    expect(bWBody.workOrders.every((w: any) => w.customerId !== customerA.user.id)).toBe(true);

    // B cannot DELETE A's vehicle.
    const aVehicles = await request.get("/api/vehicles?page=1&limit=100", { headers: authHeaders(customerA.token) });
    const aVBody = await aVehicles.json();
    const aVehicle = aVBody.vehicles.find((v: any) => v.registrationNo.toUpperCase() === regA.toUpperCase());
    expect(aVehicle).toBeTruthy();
    const del = await request.delete(`/api/vehicles/${aVehicle.id}`, { headers: authHeaders(customerB.token) });
    expect(del.status()).toBe(403);

    // A's vehicle still exists (B's delete was rejected).
    const after = await request.get("/api/vehicles?page=1&limit=100", { headers: authHeaders(customerA.token) });
    const afterBody = await after.json();
    expect(afterBody.vehicles.some((v: any) => v.id === aVehicle.id)).toBe(true);
  });

  test("staff can access authorized admin APIs", async ({ request }) => {
    const token = await adminLogin(request);
    const customers = await request.get("/api/customers?page=1&limit=5", { headers: authHeaders(token) });
    expect(customers.status()).toBe(200);
    const body = await customers.json();
    expect(body.success).toBe(true);
    const inventory = await request.get("/api/inventory", { headers: authHeaders(token) });
    expect(inventory.status()).toBe(200);
  });

  test("customer cannot invoke admin mutation endpoints", async ({ request }) => {
    const customer = await registerCustomer(request);

    const bookingsPatch = await request.patch("/api/bookings/RR-DOES-NOT-EXIST", {
      headers: authHeaders(customer.token),
      data: { status: "confirmed" },
    });
    expect(bookingsPatch.status()).toBe(403);

    const workOrderPatch = await request.patch("/api/work-orders/RR-WO-DOES-NOT-EXIST", {
      headers: authHeaders(customer.token),
      data: { stage: "IN_PROGRESS" },
    });
    expect(workOrderPatch.status()).toBe(403);

    const invoicePatch = await request.patch("/api/invoices/RR-INV-DOES-NOT-EXIST", {
      headers: authHeaders(customer.token),
      data: { paymentStatus: "Paid" },
    });
    expect(invoicePatch.status()).toBe(403);

    const serviceCreate = await request.post("/api/services", {
      headers: authHeaders(customer.token),
      data: { name: "Escalation Attempt", startingPrice: 1 },
    });
    expect(serviceCreate.status()).toBe(403);

    const ledgerRead = await request.get("/api/mpesa/transactions?page=1&limit=5", {
      headers: authHeaders(customer.token),
    });
    expect(ledgerRead.status()).toBe(403);
  });

  test("invalid, malformed, and expired authentication is rejected", async ({ request }) => {
    const garbage = await request.get("/api/customers?page=1&limit=1", { headers: { Authorization: "Bearer not.a.real.token" } });
    expect(garbage.status()).toBe(401);

    const wrongScheme = await request.get("/api/bookings?page=1&limit=1", { headers: { Authorization: "Basic abc123" } });
    expect(wrongScheme.status()).toBe(401);

    const customer = await registerCustomer(request);
    const expired = await request.get("/api/bookings?page=1&limit=1", { headers: authHeaders(expiredToken(customer.user)) });
    expect(expired.status()).toBe(401);

    const tampered = await request.get("/api/bookings?page=1&limit=1", {
      headers: authHeaders(customer.token.slice(0, -4) + "zzzz"),
    });
    expect(tampered.status()).toBe(401);
  });
});