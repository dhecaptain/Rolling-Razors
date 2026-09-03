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

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: requireEnv("DATABASE_URL", "postgresql://rolling_razors:rolling_razors_pass@localhost:5435/rolling_razors"),
  AUTH_SECRET: requireEnv("AUTH_SECRET", "rolling-razors-kenya-customs-secret-key-2026"),
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  ADMIN_PHONE: (process.env.ADMIN_PHONE || "").trim().replace(/\s+/g, ""),
  ADMIN_PASSWORD: (process.env.ADMIN_PASSWORD || "").trim(),
  ADMIN_NAME: (process.env.ADMIN_NAME || "").trim(),
  APP_URL: (process.env.APP_URL || "https://rollingrazors.co.ke").trim(),
  MPESA_CONSUMER_KEY: (process.env.MPESA_CONSUMER_KEY || "").trim(),
  MPESA_CONSUMER_SECRET: (process.env.MPESA_CONSUMER_SECRET || "").trim(),
  MPESA_PASSKEY: (process.env.MPESA_PASSKEY || "").trim(),
  MPESA_SHORTCODE: (process.env.MPESA_SHORTCODE || "").trim(),
  MPESA_ENVIRONMENT: (process.env.MPESA_ENVIRONMENT || "sandbox").trim().toLowerCase(),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "").trim(),
};

if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) {
  console.warn("[SECURITY] AUTH_SECRET is weak or default — set a strong 32+ char secret in production!");
}

export function isMpesaConfigured(): boolean {
  return Boolean(env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET);
}
