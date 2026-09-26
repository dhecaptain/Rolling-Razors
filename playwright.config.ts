import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";

// Disposable test-only credentials; never reuse these outside E2E.
process.env.AUTH_SECRET ||= randomBytes(32).toString("hex");
process.env.ADMIN_EMAIL ||= "owner@rollingrazors.test";
process.env.ADMIN_PHONE ||= "+254700000001";
process.env.ADMIN_PASSWORD ||= randomBytes(24).toString("base64url");
process.env.MPESA_CALLBACK_SECRET ||= randomBytes(32).toString("hex");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://rolling_razors:rolling_razors_pass@localhost:5435/rolling_razors",
      // Locally the mock engine needs no Postgres; CI sets DATABASE_ENGINE=postgres.
      DATABASE_ENGINE: process.env.DATABASE_ENGINE || "mock",
      AUTH_SECRET: process.env.AUTH_SECRET,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PHONE: process.env.ADMIN_PHONE,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      MPESA_CALLBACK_SECRET: process.env.MPESA_CALLBACK_SECRET,
      // Tests use the legacy provider unless a Clerk test instance is configured.
      AUTH_PROVIDER: process.env.AUTH_PROVIDER || "legacy",
      VITE_AUTH_PROVIDER: process.env.VITE_AUTH_PROVIDER || "legacy",
      // Raise rate limits so the suite's authenticated requests are not throttled
      // (production defaults remain in server/env.ts).
      RATE_LIMIT_GENERAL_MAX: "10000",
      RATE_LIMIT_AUTH_MAX: "1000",
      RATE_LIMIT_ADMIN_MAX: "1000",
      RATE_LIMIT_MPESA_MAX: "1000",
    },
  },
});
