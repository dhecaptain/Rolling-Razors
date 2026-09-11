import { defineConfig, devices } from "@playwright/test";

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
      AUTH_SECRET: "test-secret-32chars-long-for-ci-only",
      ADMIN_EMAIL: "ci@rollingrazors.co.ke",
      ADMIN_PHONE: "0712345678",
      ADMIN_PASSWORD: "ci-test-pass",
      // Tests use the legacy provider unless a Clerk test instance is configured.
      AUTH_PROVIDER: process.env.AUTH_PROVIDER || "legacy",
      // Raise rate limits so the suite's authenticated requests are not throttled
      // (production defaults remain in server/env.ts).
      RATE_LIMIT_GENERAL_MAX: "10000",
      RATE_LIMIT_AUTH_MAX: "1000",
      RATE_LIMIT_ADMIN_MAX: "1000",
      RATE_LIMIT_MPESA_MAX: "1000",
    },
  },
});
