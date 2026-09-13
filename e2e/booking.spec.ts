import { test, expect } from "@playwright/test";
import { registerCustomer, uniqueAppointment } from "./helpers";

test.describe("Booking flow", () => {
  test("protected endpoints reject unauthenticated requests", async ({ request }) => {
    const list = await request.get("/api/bookings?page=1&limit=2");
    expect(list.status()).toBe(401);

    const create = await request.post("/api/bookings", { data: {} });
    expect(create.status()).toBe(401);
  });

  test("protected endpoints reject malformed and forged tokens", async ({ request }) => {
    const malformed = await request.get("/api/bookings", { headers: { Authorization: "Bearer not-a-real-token" } });
    expect(malformed.status()).toBe(401);

    const wrongScheme = await request.get("/api/bookings", { headers: { Authorization: "Basic abc123" } });
    expect(wrongScheme.status()).toBe(401);
  });

  test("create booking and vehicle with auth", async ({ request }) => {
    const { user, phone, email } = await registerCustomer(request);
    const reg = `KDB ${Math.floor(100 + Math.random() * 900)}X`;
    const { appointmentDate, appointmentTime } = uniqueAppointment();

    const vehicle = await request.post("/api/vehicles", {
      data: {
        customerId: user.id,
        type: "Car",
        make: "Toyota",
        model: "Corolla",
        year: 2019,
        registrationNo: reg,
        color: "Silver",
      },
    });
    expect(vehicle.ok(), `vehicle create failed (${vehicle.status()})`).toBeTruthy();

    const booking = await request.post("/api/bookings", {
      data: {
        customerId: user.id,
        customerName: "Booker",
        customerPhone: phone,
        customerEmail: email,
        serviceId: "srv-1",
        serviceName: "Car Upholstery",
        vehicleDetails: { type: "Car", make: "Toyota", model: "Corolla", year: 2019, registrationNo: reg },
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
    const raw = await booking.text();
    expect(booking.ok(), `booking create failed (${booking.status()}): ${raw}`).toBeTruthy();
    const bBody = JSON.parse(raw);
    expect(bBody.success).toBe(true);
    expect(bBody.booking.id).toBeTruthy();
  });

  test("bookings pagination", async ({ request }) => {
    await registerCustomer(request);
    const res = await request.get("/api/bookings?page=1&limit=2");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.bookings)).toBe(true);
    expect(body.pagination).toBeTruthy();
  });

  test("health check", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("connected");
    expect(["clerk", "legacy"]).toContain(body.authProvider);
  });
});