import { auth } from "@clerk/nextjs/server";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { cacheIncrement } from "@/core/cache/server-cache";
import { getDb } from "@/db/client";
import { images } from "@/db/schema";
export const PRO_PLAN = "image_url_fallback_pro";
export const FREE_LIMITS = { uploadsPerMonth: 100, storageBytes: 100_000_000, uploadsPerMinute: 10, deliveriesPerMinute: 60 };
export async function getCurrentTier() { const { has } = await auth(); return has?.({ plan: PRO_PLAN }) ? "pro" : "free"; }
export async function enforceUploadAllowance(accountId: string) { const tier = await getCurrentTier(); if (tier === "pro") return tier; const bucket = Math.floor(Date.now() / 60_000); if (await cacheIncrement(`rate:upload:${accountId}:${bucket}`, 120) > FREE_LIMITS.uploadsPerMinute) throw new Error("Free tier upload rate limit reached. Upgrade for higher limits."); const month = new Date(); month.setUTCDate(1); month.setUTCHours(0, 0, 0, 0); const [usage] = await getDb().select({ count: count(), bytes: sql<number>`coalesce(sum(${images.byteSize}), 0)` }).from(images).where(and(eq(images.accountId, accountId), gte(images.createdAt, month))); if (Number(usage.count) >= FREE_LIMITS.uploadsPerMonth || Number(usage.bytes) >= FREE_LIMITS.storageBytes) throw new Error("Free tier monthly upload or storage limit reached. Upgrade for unlimited usage."); return tier; }
