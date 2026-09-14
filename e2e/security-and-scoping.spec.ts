import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { registerCustomer, uniqueAppointment } from "./helpers";

/**
 * Cross-cutting security and data-scoping coverage:
 *   - customers cannot read or mutate other customers' records
 *   - customers cannot reach any admin-only endpoint
 *   - the customer self-cancel flow works and releases the slot
 *   - optimistic admin mutations (work-order versioning) survive conflicts
 *   - logout revokes the legacy session
 *
 * Runs against whichever engine is configured (Postgres in CI, the in-memory
 * mock locally), so it also guards environment-specific regressions such as
 * missing mock model handlers.
 *
 * Independent sessions are created via `playwright.request.newContext()` (each
 * context holds its own HttpOnly session cookie).
 */

async function createBooking(request: APIRequestContext, user: { id: string }, phone: string, email: string) {
  const { appointmentDate, appointmentTime } = uniqueAppointment();
  const res = await request.post("/api/bookings", {
    data: {
      customerId: user.id,
      customerName: "SecurityScoping",
      customerPhone: phone,
      customerEmail: email,
      serviceId: "srv-1",
      serviceName: "Car Upholstery",
      vehicleDetails: { type: "Car", make: "Toyota", model: "Axio", year: 2020, registrationNo: `KBA ${Math.floor(100 + Math.random() * 900)}J` },
      appointmentDate,
      appointmentTime,
      locationType: "workshop",
      estimatedPrice: 18000,
      depositAmount: 6300,
      status: "pending",
      privacyAccepted: true,
      termsAccepted: true,
    },
  });
  const raw = await res.text();
  expect(res.ok(), `booking create failed (${res.status()}): ${raw}`).toBeTruthy();
  return JSON.parse(raw).booking;
}

test.describe("Security & data scoping", () => {
  test("unauthenticated requests hit 401 on all protected endpoints", async ({ request }) => {
    const protectedPaths = [
      "/api/bookings",
      "/api/vehicles",
      "/api/work-orders",
      "/api/invoices",
      "/api/build-draft",
      "/api/customers",
      "/api/audit-logs",
      "/api/inventory",
      "/api/inventory/low",
      "/api/staff",
      "/api/mpesa/transactions",
    ];
    for (const p of protectedPaths) {
      const res = await request.get(p);
      expect(res.status(), `${p} should require auth`).toBe(401);
    }
    const anonPush = await request.post("/api/mpesa/stkpush", { data: { phone: "0712345678", amount: 100, bookingId: "RR-1" } });
    expect(anonPush.status()).toBe(401);
  });

  test("build-draft CRUD works and is scoped per user", async ({ playwright }) => {
    const a = await playwright.request.newContext();
    const b = await playwright.request.newContext();
    await registerCustomer(a);
    await registerCustomer(b);

    const initial = await (await a.get("/api/build-draft")).json();
    expect(initial).toMatchObject({ success: true, draft: null });

    const saved = await a.put("/api/build-draft", { data: { material: "Leather", color: "Tan", pattern: "Diamond" } });
    expect(saved.ok()).toBeTruthy();
    expect((await saved.json()).draft).toMatchObject({ material: "Leather", color: "Tan", pattern: "Diamond" });

    const read = await (await a.get("/api/build-draft")).json();
    expect(read.draft).toMatchObject({ material: "Leather", pattern: "Diamond" });

    const updated = await a.put("/api/build-draft", { data: { material: "Vinyl", color: "Black", pattern: "Carbon" } });
    expect(((await updated.json()).draft)?.material).toBe("Vinyl");

    // b must not see a's draft
    expect(((await (await b.get("/api/build-draft")).json()).draft)).toBeNull();

    // b's own draft stays isolated
    await b.put("/api/build-draft", { data: { material: "Canvas", color: "Olive", pattern: "Plain" } });
    expect(((await (await b.get("/api/build-draft")).json()).draft)?.material).toBe("Canvas");
    expect(((await (await a.get("/api/build-draft")).json()).draft)?.material).toBe("Vinyl");

    await a.delete("/api/build-draft");
    expect(((await (await a.get("/api/build-draft")).json()).draft)).toBeNull();
    expect(((await (await b.get("/api/build-draft")).json()).draft)?.material).toBe("Canvas");
  });

  test("customers cannot see each other's vehicles, bookings, or work orders", async ({ playwright }) => {
    const a = await playwright.request.newContext();
    const b = await playwright.request.newContext();
    const A = await registerCustomer(a);
    await registerCustomer(b);

    const reg = `KBB ${Math.floor(100 + Math.random() * 900)}R`;
    const veh = await a.post("/api/vehicles", {
      data: { customerId: A.user.id, type: "Car", make: "Toyota", model: "Axio", year: 2020, registrationNo: reg },
    });
    expect(veh.status()).toBe(201);
    const booking = await createBooking(a, A.user, A.phone, A.email);

    // B sees none of A's data
    const bBookings = await (await b.get("/api/bookings?limit=50")).json();
    expect((bBookings.bookings as any[]).map((x: any) => x.id)).not.toContain(booking.id);

    const bVehicles = await (await b.get("/api/vehicles?limit=50")).json();
    expect((bVehicles.vehicles as any[]).find((v: any) => v.registrationNo === reg)).toBeUndefined();

    const bWo = await (await b.get("/api/work-orders?limit=50")).json();
    expect((bWo.workOrders as any[]).filter((w: any) => w.bookingId === booking.id)).toHaveLength(0);

    // A sees their own
    const aVehicles = await (await a.get("/api/vehicles?limit=50")).json();
    expect((aVehicles.vehicles as any[]).find((v: any) => v.registrationNo === reg)?.customerId).toBe(A.user.id);
    const aWo = await (await a.get("/api/work-orders?limit=50")).json();
    expect((aWo.workOrders as any[]).some((w: any) => w.bookingId === booking.id)).toBeTruthy();
  });

  test("customers are blocked from every admin endpoint (403)", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const { user } = await registerCustomer(ctx);

    const getCalls = [
      "/api/customers",
      "/api/audit-logs",
      "/api/inventory",
      "/api/inventory/low",
      "/api/staff",
      "/api/mpesa/transactions",
    ];
    for (const p of getCalls) {
      const res = await ctx.get(p);
      expect(res.status(), `${p} should be 403 for customers`).toBe(403);
    }

    const createService = await ctx.post("/api/services", {
      data: { name: "Hack", startingPrice: 100 },
    });
    expect(createService.status()).toBe(403);

    const patchInvoice = await ctx.patch("/api/invoices/nonexistent", { data: { paymentStatus: "Paid" } });
    expect(patchInvoice.status()).toBe(403);

    // a customer cannot "confirm" a booking that is theirs, or write internal notes
    const booking = await createBooking(ctx, user, `07${Math.floor(10000000 + Math.random() * 90000000)}`, `u${Date.now()}@test.ke`);
    const confirm = await ctx.patch(`/api/bookings/${booking.id}`, { data: { status: "confirmed" } });
    expect(confirm.status(), `customers must not confirm bookings: ${await confirm.text()}`).toBe(403);
    const note = await ctx.patch(`/api/bookings/${booking.id}`, { data: { internalNotes: "hax" } });
    expect(note.status()).toBe(403);

    // a customer cannot drive work orders
    const woList = await (await ctx.get("/api/work-orders?limit=5")).json();
    if ((woList.workOrders as any[]).length > 0) {
      const wo = (woList.workOrders as any[])[0];
      const foreignWo = await ctx.patch(`/api/work-orders/${wo.id}`, { data: { stage: "IN_PROGRESS" } });
      expect(foreignWo.status()).toBe(403);
    }
  });

  test("a customer can cancel their own booking; the slot is freed", async ({ playwright }) => {
    const a = await playwright.request.newContext();
    const b = await playwright.request.newContext();
    const A = await registerCustomer(a);
    await registerCustomer(b);

    const booking = await createBooking(a, A.user, A.phone, A.email);

    const cancel = await a.patch(`/api/bookings/${booking.id}`, { data: { status: "cancelled" } });
    expect(cancel.status(), `self-cancel should work: ${await cancel.text()}`).toBe(200);
    expect((await cancel.json()).booking.status).toBe("cancelled");

    // the cancelled slot must be reusable — rebook the exact same slot
    const again = await a.post("/api/bookings", {
      data: {
        customerId: A.user.id,
        customerName: "SecurityScoping",
        customerPhone: A.phone,
        customerEmail: A.email,
        serviceId: "srv-1",
        serviceName: "Car Upholstery",
        vehicleDetails: { type: "Car", make: "Toyota", model: "Axio", year: 2020, registrationNo: `KBC ${Math.floor(100 + Math.random() * 900)}L` },
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        locationType: "workshop",
        estimatedPrice: 18000,
        depositAmount: 6300,
        status: "pending",
        privacyAccepted: true,
        termsAccepted: true,
      },
    });
    expect(again.status(), `slot should be reusable after cancel: ${await again.text()}`).toBe(201);

    // another customer cannot cancel a booking they don't own
    const bookingB = await createBooking(a, A.user, A.phone, A.email);
    const foreignCancel = await b.patch(`/api/bookings/${bookingB.id}`, { data: { status: "cancelled" } });
    expect(foreignCancel.status()).toBe(403);
  });

  test("vehicle deletion is ownership-scoped", async ({ playwright }) => {
    const a = await playwright.request.newContext();
    const b = await playwright.request.newContext();
    const A = await registerCustomer(a);
    await registerCustomer(b);

    const veh = await a.post("/api/vehicles", {
      data: { customerId: A.user.id, type: "Car", make: "Toyota", model: "Axio", year: 2020, registrationNo: `KBD ${Math.floor(100 + Math.random() * 900)}S` },
    });
    const vehicleId = ((await veh.json()).vehicle as any).id;

    const foreignDel = await b.delete(`/api/vehicles/${vehicleId}`);
    expect(foreignDel.status()).toBe(403);

    const ownDel = await a.delete(`/api/vehicles/${vehicleId}`);
    expect(ownDel.status()).toBe(200);
  });

  test("admin mutations respect work-order optimistic versioning (409 on conflict)", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const A = await registerCustomer(ctx);
    const booking = await createBooking(ctx, A.user, A.phone, A.email);

    const admin = await playwright.request.newContext();
    const login = await admin.post("/api/auth/admin/login", {
      data: { identifier: process.env.ADMIN_EMAIL || "ci@rollingrazors.co.ke", password: process.env.ADMIN_PASSWORD || "ci-test-pass" },
    });
    expect(login.status(), `admin login failed: ${await login.text()}`).toBe(200);

    const woList = await (await admin.get("/api/work-orders?limit=50")).json();
    const wo = (woList.workOrders as any[]).find((w: any) => w.bookingId === booking.id);
    expect(wo, "booking must have a linked work order").toBeTruthy();

    const first = await admin.patch(`/api/work-orders/${wo.id}`, {
      data: { stage: "MATERIALS_PREPARED", progressPercentage: 50, version: wo.version },
    });
    expect(first.status(), `first stage update should succeed: ${await first.text()}`).toBe(200);
    expect((await first.json()).workOrder.version).toBe(wo.version + 1);

    const stale = await admin.patch(`/api/work-orders/${wo.id}`, {
      data: { stage: "IN_PROGRESS", progressPercentage: 70, version: wo.version },
    });
    expect(stale.status()).toBe(409);
  });

  test("admin can update bookings (Casbin path) while customers cannot", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const A = await registerCustomer(ctx);
    const booking = await createBooking(ctx, A.user, A.phone, A.email);

    const admin = await playwright.request.newContext();
    const login = await admin.post("/api/auth/admin/login", {
      data: { identifier: process.env.ADMIN_EMAIL || "ci@rollingrazors.co.ke", password: process.env.ADMIN_PASSWORD || "ci-test-pass" },
    });
    expect(login.status(), `admin login failed: ${await login.text()}`).toBe(200);

    const note = await admin.patch(`/api/bookings/${booking.id}`, { data: { internalNotes: "Priority customer" } });
    expect(note.status(), `admin booking patch should work: ${await note.text()}`).toBe(200);
    expect((await note.json()).booking.internalNotes).toBe("Priority customer");

    const custNote = await ctx.patch(`/api/bookings/${booking.id}`, { data: { internalNotes: "hax" } });
    expect(custNote.status()).toBe(403);
    const custConfirm = await ctx.patch(`/api/bookings/${booking.id}`, { data: { status: "confirmed" } });
    expect(custConfirm.status()).toBe(403);
  });

  test("logout revokes the session cookie + token", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    await registerCustomer(ctx);
    expect((await ctx.get("/api/bookings")).status()).toBe(200);

    const logout = await ctx.post("/api/auth/logout");
    expect(logout.status()).toBe(200);

    expect((await ctx.get("/api/bookings")).status()).toBe(401);
  });
});