import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { ensureAccount } from "@/core/accounts/account-service";
import { verifyApiKey } from "@/core/security/api-keys";
import { getDb } from "@/db/client";
import { apiKeys } from "@/db/schema";
export async function authenticateRequest(request: Request, requiredScope: string) { const { userId } = await auth(); if (userId) return ensureAccount(userId); const raw = request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""); if (!raw?.startsWith("imf_")) return null; const prefix = raw.split("_").slice(0, 2).join("_"); const key = await getDb().query.apiKeys.findFirst({ where: and(eq(apiKeys.prefix, prefix), isNull(apiKeys.revokedAt)) }); if (!key || !verifyApiKey(raw, key.secretHash) || !key.scopes.includes(requiredScope)) return null; await getDb().update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id)); return { id: key.accountId, clerkUserId: "api-key" }; }
