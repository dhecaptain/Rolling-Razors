import * as Sentry from "@sentry/node";
import { env } from "./env";

export function initSentry() {
  if (!env.SENTRY_DSN) {
    if (env.NODE_ENV === "production") console.warn("[Sentry] SENTRY_DSN not set — error tracking disabled");
    return;
  }
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
  });
}

export { Sentry };
