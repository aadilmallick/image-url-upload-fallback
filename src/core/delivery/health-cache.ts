import { createHash } from "node:crypto";
import { cacheGet, cacheIncrement, cacheSet } from "@/core/cache/server-cache";
import { ImageProvider, ProviderHealth } from "@/core/providers/types";
const key = (prefix: string, url: string) => `${prefix}:${createHash("sha256").update(url).digest("hex")}`;
export async function checkWithCircuit(provider: ImageProvider, url: string): Promise<ProviderHealth> { const cached = await cacheGet(key("health", url)); if (cached) return cached as ProviderHealth; if (await cacheGet(key("circuit", url))) return "unavailable"; const health = await provider.check(url); await cacheSet(key("health", url), health, health === "healthy" ? 60 : 15); if (health === "unavailable") { const failures = await cacheIncrement(key("failures", url), 60); if (failures >= 3) await cacheSet(key("circuit", url), "open", 60); } return health; }
