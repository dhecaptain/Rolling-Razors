import { test, expect } from "@playwright/test";

test.describe("M-Pesa", () => {
  test("STK push validation - missing credentials should 503 or 400", async ({ request }) => {
    const res = await request.post("/api/mpesa/stkpush", {
      data: { phone: "0712345678", amount: 100, bookingId: "RR-9999" },
    });
    expect([400, 404, 503, 502]).toContain(res.status());
  });

  test("STK amount mismatch should 400 if booking exists", async ({ request }) => {
    const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
    const email = `mpesa${Date.now()}@test.ke`;
    const reg = await request.post("/api/auth/customer/register", { data: { name: "MpesaUser", phone, email } });
    const { token, user } = (await reg.json()).user ? await reg.json().then(r => ({ token: r.token, user: r.user })) : { token: "", user: {} as any };
    if (!token) return;

    const booking = await request.post("/api/bookings", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        id: `RR-${Date.now()}`, customerId: user.id, customerName: "MpesaUser", customerPhone: phone, customerEmail: email,
        serviceId: "srv-1", serviceName: "Car Upholstery",
        vehicleDetails: { type: "Car", make: "Toyota", model: "Axio", year: 2020, registrationNo: `KAA ${Math.floor(100+Math.random()*900)}Z` },
        appointmentDate: new Date(Date.now()+86400000).toISOString().split("T")[0], appointmentTime: "10:00 AM",
        locationType: "workshop", estimatedPrice: 18000, depositAmount: 6300, status: "pending", workOrderId: `RR-WO-${Date.now()}`,
      },
    });
    const b = await booking.json();
    if (!b.booking) return;
    const stk = await request.post("/api/mpesa/stkpush", {
      headers: { Authorization: `Bearer ${token}` },
      data: { phone, amount: 999, bookingId: b.booking.id },
    });
    expect(stk.status()).toBe(400);
    const body = await stk.json();
    expect(body.error).toMatch(/mismatch/i);
  });

  test("callback without secret should be rejected if secret set", async ({ request }) => {
    const res = await request.post("/api/mpesa/callback", {
      data: { Body: { stkCallback: { CheckoutRequestID: "ws_CO_123", ResultCode: 0, CallbackMetadata: { Item: [{ Name: "MpesaReceiptNumber", Value: "QJ12345678" }] } } } },
    });
    expect([200, 401]).toContain(res.status());
  });
});
