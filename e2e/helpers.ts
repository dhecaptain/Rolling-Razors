import { APIRequestContext, expect } from "@playwright/test";

export type AuthProvider = "clerk" | "legacy";

/** Reads the active auth provider from the health endpoint. */
export async function getAuthProvider(request: APIRequestContext): Promise<AuthProvider> {
  const res = await request.get("/api/health");
  const body = await res.json().catch(() => ({}));
  return body?.authProvider === "clerk" ? "clerk" : "legacy";
}

export interface TestCustomer {
  user: { id: string; name: string; phone: string; email: string; role: string };
  phone: string;
  email: string;
  password: string;
}

export const TEST_PASSWORD = "E2ePass!234";

/**
 * Registers a throwaway customer (password-only legacy auth) and returns the
 * resulting profile. The session is established via the HttpOnly cookie set by
 * the server, so subsequent requests in the same `request` context are
 * authenticated automatically — do NOT pass an Authorization header.
 *
 * NOTE: uses the legacy registration endpoint. In Clerk mode (AUTH_PROVIDER=clerk)
 * that endpoint is disabled; Clerk-mode E2E requires a Clerk test instance and
 * @clerk/testing (see docs/CLERK_SETUP.md). Tests that need an authenticated
 * identity call `requireLegacyProvider()` first.
 */
export async function registerCustomer(request: APIRequestContext): Promise<TestCustomer> {
  const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
  const email = `e2e${Date.now()}${Math.floor(Math.random() * 1000)}@test.ke`;
  const res = await request.post("/api/auth/customer/register", {
    data: { name: "E2E Tester", phone, email, password: TEST_PASSWORD },
  });
  const raw = await res.text();
  expect(res.ok(), `customer register failed (${res.status()}): ${raw}`).toBeTruthy();
  const body = JSON.parse(raw);
  expect(body.success, "registration did not succeed").toBeTruthy();
  return { user: body.user, phone, email, password: TEST_PASSWORD };
}

/**
 * Re-establishes a session as a previously-registered customer. The mock server
 * stores one HttpOnly cookie per request context, so registering a second
 * customer overwrites the first session — call this before acting as an
 * earlier customer again.
 */
export async function loginCustomer(request: APIRequestContext, phone: string, password: string): Promise<void> {
  const res = await request.post("/api/auth/customer/login", { data: { phone, password } });
  const raw = await res.text();
  expect(res.ok(), `customer login failed (${res.status()}): ${raw}`).toBeTruthy();
}

/**
 * Generates a collision-resistant future appointment slot. The backend rejects
 * duplicate (date, time) pairs, and Playwright runs specs in parallel, so we
 * derive the date from the timestamp (200+ days out) plus a random offset.
 */
export function uniqueAppointment(): { appointmentDate: string; appointmentTime: string } {
  const stamp = Date.now();
  const days = 200 + (stamp % 2000) + Math.floor(Math.random() * 1000);
  const d = new Date(Date.now() + days * 86400000);
  const appointmentDate = d.toISOString().split("T")[0];
  const hour = 8 + (stamp % 8);
  const minute = stamp % 60;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const hour12 = hour > 12 ? hour - 12 : hour;
  const appointmentTime = `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
  return { appointmentDate, appointmentTime };
}