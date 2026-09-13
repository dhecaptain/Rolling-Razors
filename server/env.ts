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
  PORT: 3000,
  DATABASE_URL: requireEnv("DATABASE_URL", "postgresql://rolling_razors:rolling_razors_pass@localhost:5435/rolling_razors"),
  // Storage engine: "mock" (JSON file, local/tests) or "postgres" (real Prisma + pg/Neon, production).
  DATABASE_ENGINE: ((process.env.DATABASE_ENGINE || "mock").trim().toLowerCase()) as "mock" | "postgres",
  // "require" | "disable"; defaults to require when DATABASE_URL targets neon.tech.
  DATABASE_SSL: (process.env.DATABASE_SSL || "").trim().toLowerCase(),

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
  AUTH_SECRET: (process.env.AUTH_SECRET || "rolling-razors-kenya-customs-secret-key-2026-auth-secure").trim(),
  // No default admin credentials in production: fail closed below if unset.
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || "james@rollingrazors.co.ke").trim().toLowerCase(),
  ADMIN_PHONE: (process.env.ADMIN_PHONE || "+254 712 345 678").trim().replace(/\s+/g, ""),
  ADMIN_PASSWORD: (process.env.ADMIN_PASSWORD || "RollingRazors@2026!").trim(),
  ADMIN_NAME: (process.env.ADMIN_NAME || "James Kimani (Owner)").trim(),

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
};

if (env.NODE_ENV === "production" && !configuredProvider) {
  throw new Error("AUTH_PROVIDER must be explicitly set to 'clerk' or 'legacy' in production.");
}

if (!["mock", "postgres"].includes(env.DATABASE_ENGINE)) {
  throw new Error(`DATABASE_ENGINE must be 'mock' or 'postgres', got '${env.DATABASE_ENGINE}'.`);
}
if (env.NODE_ENV === "production" && env.DATABASE_ENGINE !== "postgres") {
  throw new Error("DATABASE_ENGINE must be 'postgres' in production — the JSON mock is not persistent on Vercel.");
}
if (env.DATABASE_ENGINE === "postgres" && !env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required when DATABASE_ENGINE=postgres.");
}

// --- Distributed rate limiting / revocation store (Vercel hardening) ---
// RATE_LIMIT_STORE=memory (default; local dev + tests) | upstash (durable, shared across Vercel instances)
const rateLimitStore = (process.env.RATE_LIMIT_STORE || "memory").trim().toLowerCase();
if (!["memory", "upstash"].includes(rateLimitStore)) {
  throw new Error(`RATE_LIMIT_STORE must be 'memory' or 'upstash', got '${rateLimitStore}'.`);
}
if (rateLimitStore === "upstash") {
  const missing: string[] = [];
  if (!(process.env.UPSTASH_REDIS_REST_URL || "").trim()) missing.push("UPSTASH_REDIS_REST_URL");
  if (!(process.env.UPSTASH_REDIS_REST_TOKEN || "").trim()) missing.push("UPSTASH_REDIS_REST_TOKEN");
  if (missing.length) {
    const msg = `RATE_LIMIT_STORE=upstash requires ${missing.join(", ")}.`;
    if (env.NODE_ENV === "production") throw new Error(msg);
    console.warn(`[ENV] ${msg}`);
  }
}
env.RATE_LIMIT_STORE = rateLimitStore;

if (env.AUTH_PROVIDER === "legacy") {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32 || env.AUTH_SECRET === "rolling-razors-kenya-customs-secret-key-2026") {
    const msg = "[SECURITY] AUTH_SECRET is weak/default — set a strong 32+ char secret (or switch to AUTH_PROVIDER=clerk)!";
    if (env.NODE_ENV === "production") throw new Error(msg);
    console.warn(msg);
  }
  if (env.NODE_ENV === "production") {
    if (!env.ADMIN_PASSWORD || !env.ADMIN_EMAIL) {
      throw new Error("ADMIN_PASSWORD and ADMIN_EMAIL are required in production when AUTH_PROVIDER=legacy.");
    }
    // Never trust a plaintext admin password in production — require a bcrypt hash ($2a$/$2b$/$2y$).
    if (!/^\$2[aby]\$/.test(env.ADMIN_PASSWORD)) {
      throw new Error("ADMIN_PASSWORD must be a bcrypt hash in production (generate with `htpasswd -bnBC 12 '' <password>`).");
    }
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
  throw new Error("MPESA_CALLBACK_SECRET is required in production — M-Pesa callbacks are authenticated against it and verified with Daraja before payments are applied.");
}

export function isMpesaConfigured(): boolean {
  return Boolean(env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET);
}

export function isClerkEnabled(): boolean {
  return env.AUTH_PROVIDER === "clerk";
}
