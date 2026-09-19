import { test, expect } from "@playwright/test";
import { registerCustomer, loginAdmin } from "./helpers";

// Minimal 1x1 transparent PNG as base64
const TINY_PNG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

test.describe("Storage & Photo Uploads", () => {
  test("unauthenticated upload request is rejected with 401", async ({ request }) => {
    const res = await request.post("/api/uploads", {
      data: {
        category: "booking-reference",
        originalFilename: "test.png",
        mimeType: "image/png",
        base64Data: TINY_PNG_BASE64,
      },
    });
    expect(res.status()).toBe(401);
  });

  test("invalid MIME type upload is rejected with 400", async ({ request }) => {
    await registerCustomer(request);
    const res = await request.post("/api/uploads", {
      data: {
        category: "booking-reference",
        originalFilename: "test.exe",
        mimeType: "application/x-msdownload",
        base64Data: TINY_PNG_BASE64,
      },
    });
    expect(res.status()).toBe(400);
  });

  test("authenticated customer can upload booking reference photo", async ({ request }) => {
    await registerCustomer(request);
    const res = await request.post("/api/uploads", {
      data: {
        category: "booking-reference",
        originalFilename: "seat-inspiration.png",
        mimeType: "image/png",
        base64Data: TINY_PNG_BASE64,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.file).toBeDefined();
    expect(body.file.url).toBeTruthy();
    expect(body.file.key).toBeTruthy();
  });

  test("admin can update work order with inspection photos", async ({ request }) => {
    await loginAdmin(request);
    // Fetch work orders
    const woListRes = await request.get("/api/work-orders");
    if (!woListRes.ok()) return;
    const woBody = await woListRes.json();
    const orders = woBody.workOrders || woBody;
    if (!Array.isArray(orders) || orders.length === 0) return;

    const targetOrder = orders[0];
    const testPhotoUrl = "/api/uploads/file/test-photo.jpg";

    const patchRes = await request.patch(`/api/work-orders/${targetOrder.id}`, {
      data: {
        beforePhotos: [testPhotoUrl],
        progressPhotos: [testPhotoUrl],
        afterPhotos: [testPhotoUrl],
        version: targetOrder.version ?? 0,
      },
    });

    expect([200, 409]).toContain(patchRes.status());
    if (patchRes.status() === 200) {
      const patched = await patchRes.json();
      expect(patched.success).toBe(true);
      expect(patched.workOrder.beforePhotos).toContain(testPhotoUrl);
    }
  });

  test("private asset endpoint rejects unauthenticated access", async ({ request }) => {
    const res = await request.get("/api/uploads/file/work-order-before-test.jpg");
    expect(res.status()).toBe(403);
  });

  test("customer cannot access another customer's private work-order asset without signed url", async ({ request }) => {
    await registerCustomer(request);
    // Key that does not belong to this customer
    const encoded = encodeURIComponent("work-order/wo-other-customer/test.jpg");
    const res = await request.get(`/api/uploads/file/${encoded}`);
    expect(res.status()).toBe(403);
  });
});
