import { test, expect } from "@playwright/test";
import { loginCustomer, registerCustomer, uniqueAppointment } from "./helpers";

async function createBooking(request: import("@playwright/test").APIRequestContext, user: { id: string }, phone: string, email: string) {
  const { appointmentDate, appointmentTime } = uniqueAppointment();
  const res = await request.post("/api/bookings", {
    data: {
      customerId: user.id,
      customerName: "DataIntegrity",
      customerPhone: phone,
      customerEmail: email,
      serviceId: "srv-1",
      serviceName: "Car Upholstery",
      vehicleDetails: { type: "Car", make: "Toyota", model: "Axio", year: 2020, registrationNo: `KBB ${Math.floor(100 + Math.random() * 900)}Y` },
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

test.describe("Data integrity", () => {
  test("vehicle registration cannot be claimed by another customer (409)", async ({ request }) => {
    const a = await registerCustomer(request);
    const reg = `KAA ${Math.floor(100 + Math.random() * 900)}Z`;

    const first = await request.post("/api/vehicles", {
      data: { customerId: a.user.id, type: "Car", make: "Toyota", model: "Axio", year: 2020, registrationNo: reg },
    });
    expect(first.ok(), "owner should be able to register their vehicle").toBeTruthy();

    const b = await registerCustomer(request);
    const steal = await request.post("/api/vehicles", {
      data: { customerId: b.user.id, type: "Car", make: "Honda", model: "Fit", year: 2021, registrationNo: reg },
    });
    expect(steal.status()).toBe(409);

    await loginCustomer(request, a.phone, a.password);
    const asA = await request.get("/api/vehicles?limit=50");
    const aList = (await asA.json()).vehicles;
    expect(aList.find((v: any) => v.registrationNo === reg)?.customerId).toBe(a.user.id);
  });

  test("re-adding own vehicle is idempotent (200, same id)", async ({ request }) => {
    const { user } = await registerCustomer(request);
    const reg = `KDK ${Math.floor(100 + Math.random() * 900)}M`;

    const first = await request.post("/api/vehicles", {
      data: { customerId: user.id, type: "Car", make: "Mazda", model: "Demio", year: 2018, registrationNo: reg },
    });
    expect(first.status()).toBe(201);
    const firstBody = await first.json();

    const second = await request.post("/api/vehicles", {
      data: { customerId: user.id, type: "Car", make: "Mazda", model: "Demio", year: 2018, registrationNo: reg },
    });
    expect([200, 201]).toContain(second.status());
    const secondBody = await second.json();
    expect(secondBody.vehicle.id).toBe(firstBody.vehicle.id);
    expect(secondBody.vehicle.registrationNo).toBe(reg);
  });

  test("same appointment slot cannot be double-booked (409)", async ({ request }) => {
    const { user, phone, email } = await registerCustomer(request);
    const first = await createBooking(request, user, phone, email);

    const dup = await request.post("/api/bookings", {
      data: {
        customerId: user.id,
        customerName: "DataIntegrity",
        customerPhone: phone,
        customerEmail: email,
        serviceId: "srv-1",
        serviceName: "Car Upholstery",
        vehicleDetails: { type: "Car", make: "Toyota", model: "Axio", year: 2020, registrationNo: `KBC ${Math.floor(100 + Math.random() * 900)}X` },
        appointmentDate: first.appointmentDate,
        appointmentTime: first.appointmentTime,
        locationType: "workshop",
        estimatedPrice: 18000,
        depositAmount: 6300,
        status: "pending",
        privacyAccepted: true,
        termsAccepted: true,
      },
    });
    expect(dup.status()).toBe(409);
    const body = await dup.json();
    expect(body.error).toMatch(/reserved|choose another time/i);
  });

  test("work-orders are scoped to the owner and pagination is correct", async ({ request }) => {
    const owner = await registerCustomer(request);
    await createBooking(request, owner.user, owner.phone, owner.email);

    const ownerList = await request.get("/api/work-orders?page=1&limit=10");
    expect(ownerList.ok()).toBeTruthy();
    const ownerBody = await ownerList.json();
    expect(ownerBody.workOrders.length).toBeGreaterThanOrEqual(1);
    expect(ownerBody.workOrders[0].customerId).toBe(owner.user.id);

    const other = await registerCustomer(request);
    const otherList = await request.get("/api/work-orders?page=1&limit=10");
    expect(otherList.ok()).toBeTruthy();
    const otherBody = await otherList.json();
    expect(otherBody.workOrders.length).toBe(0);
  });
});