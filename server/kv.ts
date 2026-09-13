import { Redis } from "@upstash/redis";

/**
 * Tiny KV abstraction used by the serverless hardening layer:
 *   - RATE_LIMIT_STORE=memory  (default; local dev + tests) — in-process only.
 *   - RATE_LIMIT_STORE=upstash — durable, shared across Vercel function
 *     instances (jti denylist, Daraja token cache must survive cold starts).
 */

export interface Kv {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec?: number): Promise<void>;
  del(key: string): Promise<void>;
  sadd(key: string, member: string, ttlSec?: number): Promise<void>;
  sismember(key: string, member: string): Promise<boolean>;
  srem(key: string, member: string): Promise<void>;
}

class MemoryKv implements Kv {
  private scalar = new Map<string, { value: string; expiresAt: number }>();
  private sets = new Map<string, Map<string, number>>();

  private alive(expiresAt: number): boolean {
    return expiresAt === 0 || expiresAt > Date.now();
  }

  async get(key: string): Promise<string | null> {
    const e = this.scalar.get(key);
    if (!e) return null;
    if (!this.alive(e.expiresAt)) { this.scalar.delete(key); return null; }
    return e.value;
  }

  async set(key: string, value: string, ttlSec?: number): Promise<void> {
    this.scalar.set(key, { value, expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : 0 });
  }

  async del(key: string): Promise<void> {
    this.scalar.delete(key);
    this.sets.delete(key);
  }

  async sadd(key: string, member: string, ttlSec?: number): Promise<void> {
    let set = this.sets.get(key);
    if (!set) { set = new Map(); this.sets.set(key, set); }
    set.set(member, ttlSec ? Date.now() + ttlSec * 1000 : 0);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const set = this.sets.get(key);
    if (!set) return false;
    const exp = set.get(member);
    if (exp === undefined) return false;
    if (!this.alive(exp)) { set.delete(member); return false; }
    return true;
  }

  async srem(key: string, member: string): Promise<void> {
    this.sets.get(key)?.delete(member);
  }
}

class UpstashKv implements Kv {
  private redis: Redis;
  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get<string>(key);
  }
  async set(key: string, value: string, ttlSec?: number): Promise<void> {
    await this.redis.set(key, value, ttlSec ? { ex: ttlSec } : undefined);
  }
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
  async sadd(key: string, member: string, ttlSec?: number): Promise<void> {
    await this.redis.sadd(key, member);
    if (ttlSec) await this.redis.expire(key, ttlSec);
  }
  async sismember(key: string, member: string): Promise<boolean> {
    return (await this.redis.sismember(key, member)) === 1;
  }
  async srem(key: string, member: string): Promise<void> {
    await this.redis.srem(key, member);
  }
}

export const kv: Kv =
  (process.env.RATE_LIMIT_STORE || "memory") === "upstash" ? new UpstashKv() : new MemoryKv();