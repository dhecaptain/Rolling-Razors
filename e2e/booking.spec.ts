import { test, expect } from "@playwright/test";

test.describe("Booking flow", () => {
  test("create booking and vehicle with auth", async ({ request }) => {
    const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
    const email = `book${Date.now()}@test.ke`;
    const reg = await request.post("/api/auth/customer/register", {
      data: { name: "Booker", phone, email },
    });
    const { token, user } = await reg.json().then(r => r.user ? { token: r.token, user: r.user } : { token: r.token, user: r.user });
    expect(token).toBeTruthy();

    const vehicle = await request.post("/api/vehicles", {
      headers: { Authorization: `Bearer ${token}` },
      data: { customerId: user.id, type: "Car", make: "Toyota", model: "Corolla", year: 2019, registrationNo: `KDB ${Math.floor(100 + Math.random()*900)}X`, color: "Silver" },
    });
    expect(vehicle.ok()).toBeTruthy();

    const booking = await request.post("/api/bookings", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        id: `RR-${Date.now()}`, customerId: user.id, customerName: "Booker", customerPhone: phone, customerEmail: email,
        serviceId: "srv-1", serviceName: "Car Upholstery",
        vehicleDetails: { type: "Car", make: "Toyota", model: "Corolla", year: 2019, registrationNo: `KDB ${Math.floor(100+Math.random()*900)}Y` },
        appointmentDate: new Date(Date.now()+86400000).toISOString().split("T")[0], appointmentTime: "10:00 AM",
        locationType: "workshop", estimatedPrice: 18000, depositAmount: 6300, status: "pending", workOrderId: `RR-WO-${Date.now()}`,
      },
    });
    expect(booking.ok()).toBeTruthy();
    const bBody = await booking.json();
    expect(bBody.success).toBe(true);
    expect(bBody.booking.id).toBeTruthy();
  });

  test("bookings pagination", async ({ request }) => {
    const res = await request.get("/api/bookings?page=1&limit=2");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.bookings)).toBe(true);
    expect(body.pagination).toBeTruthy();
    expect(body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  test("health check", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("connected");
  });
});
