import Redis from "ioredis";
import { getConfig } from "@/core/config";

type MemoryEntry = { value: string; expiresAt: number };
type CacheBackend = "redis" | "memory";

/**
 * The sole cache boundary for the app. Every external Redis key is namespaced,
 * and callers depend only on this class so Redis can be swapped later.
 */
export class ServerCache {
  static readonly namespace = "image-url-fallback-app";
  private redis: Redis | undefined;
  private redisUnavailableUntil = 0;
  private readonly memory = new Map<string, MemoryEntry>();

  private key(key: string) { return `${ServerCache.namespace}:${key}`; }
  private client() {
    const url = getConfig().REDIS_URL;
    if (!url || this.redisUnavailableUntil > Date.now()) return undefined;
    if (!this.redis) { this.redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 }); this.redis.on("error", () => undefined); }
    return this.redis;
  }
  private async backend(): Promise<{ type: CacheBackend; redis?: Redis }> {
    const redis = this.client();
    if (!redis) return { type: "memory" };
    try { if (redis.status === "wait") await redis.connect(); return { type: "redis", redis }; } catch { this.redisUnavailableUntil = Date.now() + 60_000; this.redis?.disconnect(); this.redis = undefined; return { type: "memory" }; }
  }

  async get(key: string) {
    const namespaced = this.key(key);
    const backend = await this.backend();
    if (backend.redis) return backend.redis.get(namespaced);
    const entry = this.memory.get(namespaced);
    if (!entry || entry.expiresAt < Date.now()) { this.memory.delete(namespaced); return null; }
    return entry.value;
  }
  async set(key: string, value: string, seconds: number) {
    const namespaced = this.key(key);
    const backend = await this.backend();
    if (backend.redis) { await backend.redis.set(namespaced, value, "EX", seconds); return; }
    this.memory.set(namespaced, { value, expiresAt: Date.now() + seconds * 1_000 });
  }
  async increment(key: string, seconds: number) {
    const namespaced = this.key(key);
    const backend = await this.backend();
    if (backend.redis) { const value = await backend.redis.incr(namespaced); if (value === 1) await backend.redis.expire(namespaced, seconds); return value; }
    const value = Number(await this.get(key) ?? 0) + 1;
    await this.set(key, String(value), seconds);
    return value;
  }
  async delete(key: string) {
    const namespaced = this.key(key);
    const backend = await this.backend();
    if (backend.redis) { await backend.redis.del(namespaced); return; }
    this.memory.delete(namespaced);
  }
}

const cache = new ServerCache();
export const cacheGet = (key: string) => cache.get(key);
export const cacheSet = (key: string, value: string, seconds: number) => cache.set(key, value, seconds);
export const cacheIncrement = (key: string, seconds: number) => cache.increment(key, seconds);
