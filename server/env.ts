import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const val = (process.env[name] || fallback || "").trim();
  if (!val) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    console.warn(`[ENV] ${name} not set — using fallback (set it in .env for production)`);
  }
  return val;
}

const clerkSecretKey = (process.env.CLERK_SECRET_KEY || "").trim();
const clerkPublishableKey = (process.env.CLERK_PUBLISHABLE_KEY || "").trim();
const configuredProvider = (process.env.AUTH_PROVIDER || "").trim().toLowerCase();

// @clerk/express reads CLERK_PUBLISHABLE_KEY from process.env, but the Clerk CLI
// writes the client-safe key as VITE_CLERK_PUBLISHABLE_KEY. Mirror it so the
// server-side Clerk middleware can initialize from a single .env entry.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.VITE_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
}

// Auth provider selection:
//  - explicit AUTH_PROVIDER=clerk|legacy wins
//  - otherwise auto-detect: Clerk when a server secret key is present, else legacy
const authProvider: "clerk" | "legacy" =
  configuredProvider === "clerk" || configuredProvider === "legacy"
    ? (configuredProvider as "clerk" | "legacy")
    : clerkSecretKey
      ? "clerk"
      : "legacy";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: requireEnv("DATABASE_URL", "postgresql://rolling_razors:rolling_razors_pass@localhost:5435/rolling_razors"),

  // --- Authentication provider ---
  AUTH_PROVIDER: authProvider,
  // Clerk (server-only secret; NEVER expose to the client)
  CLERK_SECRET_KEY: clerkSecretKey,
  CLERK_PUBLISHABLE_KEY: clerkPublishableKey || (process.env.VITE_CLERK_PUBLISHABLE_KEY || "").trim(),
  // Optional: pin the `azp` claim to this app's origin(s), comma-separated.
  CLERK_AUTHORIZED_PARTY: (process.env.CLERK_AUTHORIZED_PARTY || "").trim(),
  // Optional defense-in-depth: comma-separated Clerk user ids allowed to be admin.
  ADMIN_CLERK_IDS: (process.env.ADMIN_CLERK_IDS || "").split(",").map(s => s.trim()).filter(Boolean),

  // --- Legacy custom auth (used only when AUTH_PROVIDER=legacy) ---
  AUTH_SECRET: (process.env.AUTH_SECRET || "").trim(),
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  ADMIN_PHONE: (process.env.ADMIN_PHONE || "").trim().replace(/\s+/g, ""),
  ADMIN_PASSWORD: (process.env.ADMIN_PASSWORD || "").trim(),
  ADMIN_NAME: (process.env.ADMIN_NAME || "").trim(),
  OTP_HASH_SECRET: (process.env.OTP_HASH_SECRET || process.env.AUTH_SECRET || "").trim(),

  APP_URL: (process.env.APP_URL || "https://rollingrazors.co.ke").trim(),
  MPESA_CONSUMER_KEY: (process.env.MPESA_CONSUMER_KEY || "").trim(),
  MPESA_CONSUMER_SECRET: (process.env.MPESA_CONSUMER_SECRET || "").trim(),
  MPESA_PASSKEY: (process.env.MPESA_PASSKEY || "").trim(),
  MPESA_SHORTCODE: (process.env.MPESA_SHORTCODE || "").trim(),
  MPESA_ENVIRONMENT: (process.env.MPESA_ENVIRONMENT || "sandbox").trim().toLowerCase(),
  MPESA_CALLBACK_SECRET: (process.env.MPESA_CALLBACK_SECRET || "").trim(),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "").trim(),
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 12),
  // Rate limits (per minute). Production defaults; override in tests to avoid flakiness.
  RATE_LIMIT_GENERAL_MAX: Number(process.env.RATE_LIMIT_GENERAL_MAX || 120),
  RATE_LIMIT_AUTH_MAX: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
  RATE_LIMIT_ADMIN_MAX: Number(process.env.RATE_LIMIT_ADMIN_MAX || 5),
  RATE_LIMIT_MPESA_MAX: Number(process.env.RATE_LIMIT_MPESA_MAX || 6),
  SENTRY_DSN: (process.env.SENTRY_DSN || "").trim(),
  SENTRY_ENV: (process.env.SENTRY_ENV || process.env.NODE_ENV || "development").trim(),
  IMAGE_CDN: (process.env.IMAGE_CDN || "unsplash").trim(),
  IMAGE_CDN_URL: (process.env.IMAGE_CDN_URL || "").trim(),
  ADMIN_IP_ALLOWLIST: (process.env.ADMIN_IP_ALLOWLIST || "").trim(),
  ADMIN_REQUIRE_2FA: (process.env.ADMIN_REQUIRE_2FA || "false").trim().toLowerCase() === "true",
};

if (env.AUTH_PROVIDER === "legacy") {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32 || env.AUTH_SECRET === "rolling-razors-kenya-customs-secret-key-2026") {
    const msg = "[SECURITY] AUTH_SECRET is weak/default — set a strong 32+ char secret (or switch to AUTH_PROVIDER=clerk)!";
    if (env.NODE_ENV === "production") throw new Error(msg);
    console.warn(msg);
  }
} else {
  if (!env.CLERK_SECRET_KEY) {
    const msg = "[SECURITY] AUTH_PROVIDER=clerk requires CLERK_SECRET_KEY.";
    if (env.NODE_ENV === "production") throw new Error(msg);
    console.warn(msg);
  }
}

if (env.NODE_ENV === "production" && !env.CORS_ORIGIN) {
  throw new Error("CORS_ORIGIN must be set in production (comma-separated allowed origins)");
}
if (env.NODE_ENV === "production" && !env.MPESA_CALLBACK_SECRET) {
  console.warn("[SECURITY] MPESA_CALLBACK_SECRET not set — callback endpoint will be unprotected!");
}

export function isMpesaConfigured(): boolean {
  return Boolean(env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET);
}

export function isClerkEnabled(): boolean {
  return env.AUTH_PROVIDER === "clerk";
}
