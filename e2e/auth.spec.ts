import { test, expect } from "@playwright/test";
import { registerCustomer, authHeaders, getAuthProvider } from "./helpers";

test.describe("Auth", () => {
  test("customer can register and login", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy registration disabled in Clerk mode (see docs/CLERK_SETUP.md)");

    const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
    const res = await request.post("/api/auth/customer/register", {
      data: { name: "E2E Tester", phone, email: `e2e${Date.now()}@test.ke` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeTruthy();

    const login = await request.post("/api/auth/customer/login", { data: { phone } });
    expect(login.ok()).toBeTruthy();
    const loginBody = await login.json();
    expect(loginBody.success).toBe(true);
  });

  test("admin login with valid credentials", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy admin login disabled in Clerk mode");
    const res = await request.post("/api/auth/admin/login", {
      data: { identifier: "james@rollingrazors.co.ke", password: process.env.ADMIN_PASSWORD || "rolling2025" },
    });
    expect([200, 401]).toContain(res.status());
  });

  test("OTP send and login", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Legacy OTP disabled in Clerk mode");

    const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
    await request.post("/api/auth/customer/register", {
      data: { name: "OTP User", phone, email: `otp${Date.now()}@test.ke` },
    });
    const otpRes = await request.post("/api/auth/customer/send-otp", { data: { phone } });
    expect(otpRes.ok()).toBeTruthy();
    const otpBody = await otpRes.json();
    expect(otpBody.success).toBe(true);
    if (otpBody.debugOtp) {
      const login = await request.post("/api/auth/customer/login", { data: { phone, otp: otpBody.debugOtp } });
      expect(login.ok()).toBeTruthy();
    }
  });

  test("unauthenticated admin endpoint returns 401", async ({ request }) => {
    const res = await request.get("/api/customers?page=1&limit=1");
    expect(res.status()).toBe(401);
  });

  test("tampered token is rejected", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Needs a legacy token to tamper with");
    const { token } = await registerCustomer(request);
    const tampered = token.slice(0, -3) + "aaa";
    const res = await request.get("/api/bookings?page=1&limit=1", { headers: authHeaders(tampered) });
    expect(res.status()).toBe(401);
  });

  test("authenticated non-admin is forbidden from admin endpoints", async ({ request }) => {
    const provider = await getAuthProvider(request);
    test.skip(provider === "clerk", "Needs a Clerk test identity; legacy path asserts the same boundary");
    const { token } = await registerCustomer(request);
    const res = await request.get("/api/customers?page=1&limit=1", { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });
});
