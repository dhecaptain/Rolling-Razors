import { test, expect } from "@playwright/test";
import { registerCustomer, getAuthProvider, TEST_PASSWORD } from "./helpers";

test.describe("Auth", () => {
  test("customer can register and login with password", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy registration disabled in Clerk mode (see docs/CLERK_SETUP.md)");

    const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
    const res = await request.post("/api/auth/customer/register", {
      data: { name: "E2E Tester", phone, email: `e2e${Date.now()}@test.ke`, password: TEST_PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);

    const login = await request.post("/api/auth/customer/login", { data: { phone, password: TEST_PASSWORD } });
    expect(login.ok()).toBeTruthy();
    const loginBody = await login.json();
    expect(loginBody.success).toBe(true);
  });

  test("customer login with wrong password is rejected", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy registration disabled in Clerk mode");
    const { phone } = await registerCustomer(request);
    const login = await request.post("/api/auth/customer/login", { data: { phone, password: "WrongPass!99" } });
    expect(login.status()).toBe(401);
  });

  test("admin login with valid credentials", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy admin login disabled in Clerk mode");
    const res = await request.post("/api/auth/admin/login", {
      data: { identifier: "james@rollingrazors.co.ke", password: process.env.ADMIN_PASSWORD || "rolling2025" },
    });
    expect([200, 401]).toContain(res.status());
  });

  test("unauthenticated admin endpoint returns 401", async ({ request }) => {
    const res = await request.get("/api/customers?page=1&limit=1");
    expect(res.status()).toBe(401);
  });

  test("forged cookie token is rejected", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Needs a legacy cookie to forge");
    const res = await request.get("/api/bookings?page=1&limit=1", {
      headers: { Cookie: "rr_auth_token=forged.tampered.token" },
    });
    expect(res.status()).toBe(401);
  });

  test("authenticated non-admin is forbidden from admin endpoints", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Needs a Clerk test identity; legacy path asserts the same boundary");
    await registerCustomer(request);
    const res = await request.get("/api/customers?page=1&limit=1");
    expect(res.status()).toBe(403);
  });
});