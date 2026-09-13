import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "./logger";

/**
 * Distributed rate limiting for the serverless (Vercel) deployment.
 *
 *   RATE_LIMIT_STORE=memory  (default; local dev + tests) → express-rate-limit
 *   RATE_LIMIT_STORE=upstash → Upstash sliding window, shared across instances
 */
const useUpstash = (process.env.RATE_LIMIT_STORE || "memory") === "upstash";

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });
  }
  return redis;
}

export interface LimiterOpts {
  max: number;
  windowMs?: number;
  name: string;
  message?: string;
  keyFns?: Array<(req: any) => string | undefined>;
}

function identifierFor(req: any, keyFns?: Array<(req: any) => string | undefined>): string {
  if (keyFns) {
    for (const fn of keyFns) {
      const v = fn(req);
      if (v) return v;
    }
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function rateLimitMiddleware(opts: LimiterOpts): RequestHandler {
  const windowMs = opts.windowMs || 60_000;
  const message = opts.message || "Too many requests. Please try again later.";

  if (useUpstash) {
    const ratelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(opts.max, `${Math.max(1, Math.round(windowMs / 1000))} s`),
      prefix: `rr:${opts.name}`,
      analytics: false,
    });
    return async (req, res, next) => {
      try {
        const { success, remaining, limit, reset } = await ratelimit.limit(identifierFor(req, opts.keyFns));
        res.setHeader("ratelimit-policy", `${limit};w=${Math.round(windowMs / 1000)}`);
        res.setHeader("ratelimit-limit", String(limit));
        res.setHeader("ratelimit-remaining", String(remaining));
        res.setHeader("ratelimit-reset", String(Math.max(0, Math.ceil((reset - Date.now()) / 1000))));
        if (!success) {
          res.setHeader("retry-after", String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))));
          return res.status(429).json({ success: false, error: message });
        }
        next();
      } catch (e) {
        // Fail-open on a rate-store outage: a total 429 would brick the site.
        // Availability over strictness here; the rest of the API stays fail-closed.
        logger.error({ err: e, name: opts.name }, "[ratelimit:upstash] store error — failing open");
        next();
      }
    };
  }

  return rateLimit({
    windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: message },
    keyGenerator: (req) => identifierFor(req, opts.keyFns),
  });
}