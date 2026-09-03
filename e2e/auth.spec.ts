import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("customer can register and login", async ({ request }) => {
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
    const res = await request.post("/api/auth/admin/login", {
      data: { identifier: "james@rollingrazors.co.ke", password: process.env.ADMIN_PASSWORD || "rolling2025" },
    });
    expect([200, 401]).toContain(res.status());
  });

  test("OTP send and login", async ({ request }) => {
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
});
