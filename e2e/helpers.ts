import { APIRequestContext, expect } from "@playwright/test";

export type AuthProvider = "clerk" | "legacy";

/** Reads the active auth provider from the health endpoint. */
export async function getAuthProvider(request: APIRequestContext): Promise<AuthProvider> {
  const res = await request.get("/api/health");
  const body = await res.json().catch(() => ({}));
  return body?.authProvider === "clerk" ? "clerk" : "legacy";
}

export interface TestCustomer {
  token: string;
  user: { id: string; name: string; phone: string; email: string; role: string };
  phone: string;
  email: string;
}

/**
 * Registers a throwaway customer and returns a bearer token.
 *
 * NOTE: this uses the legacy registration endpoint. In Clerk mode
 * (AUTH_PROVIDER=clerk) that endpoint is disabled; Clerk-mode E2E requires a
 * Clerk test instance and @clerk/testing (see docs/CLERK_SETUP.md). Tests that
 * need an authenticated identity call `requireLegacyProvider()` first.
 */
export async function registerCustomer(request: APIRequestContext): Promise<TestCustomer> {
  const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
  const email = `e2e${Date.now()}${Math.floor(Math.random() * 1000)}@test.ke`;
  const res = await request.post("/api/auth/customer/register", {
    data: { name: "E2E Tester", phone, email },
  });
  const raw = await res.text();
  expect(res.ok(), `customer register failed (${res.status()}): ${raw}`).toBeTruthy();
  const body = JSON.parse(raw);
  expect(body.token, "registration did not return a token").toBeTruthy();
  return { token: body.token as string, user: body.user, phone, email };
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
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
