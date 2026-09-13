import { kv } from "./kv";
import { logger } from "./logger";

export interface CachedEntry<T> { value: T; expiresAt: number; }

/**
 * Cross-instance value cache (TLS-equivalent of the old module-level
 * `cachedDarajaToken`). In serverless each lambda is its own process, so a
 * module-level token would be fetched (and possibly re-fetched) per warm
 * instance plus fail cold starts — wasting Daraja OAuth calls. Backing it with
 * the shared KV store means one Daraja token for the whole app.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await kv.get(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedEntry<T>;
      if (!parsed || typeof parsed.expiresAt !== "number") return null;
      if (parsed.expiresAt <= Date.now()) return null;
      return parsed.value;
    } catch (e) {
      logger.error({ err: e, key }, "[cache] get failed — treating as miss");
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSec: number): Promise<void> {
    try {
      const entry: CachedEntry<T> = { value, expiresAt: Date.now() + Math.max(1, ttlSec) * 1000 };
      await kv.set(key, JSON.stringify(entry), ttlSec);
    } catch (e) {
      // A write failure must not break the Daraja call — the caller can proceed
      // with the (uncached) token and retry the OAuth next time.
      logger.error({ err: e, key }, "[cache] set failed");
    }
  },

  async del(key: string): Promise<void> {
    try { await kv.del(key); } catch (e) { logger.error({ err: e, key }, "[cache] del failed"); }
  },
};

export const DARAJA_TOKEN_KEY = (envPrefix: string) => `rr:daraja:accesstoken:${envPrefix}`;