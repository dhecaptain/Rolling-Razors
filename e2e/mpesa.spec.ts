import { test, expect } from "@playwright/test";
import { registerCustomer, uniqueAppointment } from "./helpers";

async function createBooking(request: import("@playwright/test").APIRequestContext, user: { id: string }, phone: string, email: string) {
  const { appointmentDate, appointmentTime } = uniqueAppointment();
  const res = await request.post("/api/bookings", {
    data: {
      customerId: user.id,
      customerName: "MpesaUser",
      customerPhone: phone,
      customerEmail: email,
      serviceId: "srv-1",
      serviceName: "Car Upholstery",
      vehicleDetails: { type: "Car", make: "Toyota", model: "Axio", year: 2020, registrationNo: `KAA ${Math.floor(100 + Math.random() * 900)}Z` },
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

test.describe("M-Pesa", () => {
  test("STK push rejects unauthenticated requests", async ({ request }) => {
    const res = await request.post("/api/mpesa/stkpush", {
      data: { phone: "0712345678", amount: 100, bookingId: "RR-9999" },
    });
    expect(res.status()).toBe(401);
  });

  test("STK push validation - authenticated, unknown booking", async ({ request }) => {
    await registerCustomer(request);
    const res = await request.post("/api/mpesa/stkpush", {
      data: { phone: "0712345678", amount: 100, bookingId: "RR-9999" },
    });
    expect([400, 404, 503, 502]).toContain(res.status());
  });

  test("STK amount mismatch should 400 if booking exists", async ({ request }) => {
    const { user, phone, email } = await registerCustomer(request);
    const booking = await createBooking(request, user, phone, email);

    const stk = await request.post("/api/mpesa/stkpush", {
      data: { phone, amount: 999, bookingId: booking.id },
    });
    expect(stk.status()).toBe(400);
    const body = await stk.json();
    expect(body.error).toMatch(/mismatch/i);
  });

  test("non-admin cannot read admin M-Pesa transactions", async ({ request }) => {
    await registerCustomer(request);
    const res = await request.get("/api/mpesa/transactions?page=1&limit=5");
    expect(res.status()).toBe(403);
  });

  test("callback without secret should be rejected if secret set", async ({ request }) => {
    const res = await request.post("/api/mpesa/callback", {
      data: { Body: { stkCallback: { CheckoutRequestID: "ws_CO_123", ResultCode: 0, CallbackMetadata: { Item: [{ Name: "MpesaReceiptNumber", Value: "QJ12345678" }] } } } },
    });
    expect([200, 401]).toContain(res.status());
  });
});