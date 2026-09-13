import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { ensureAccount } from "@/core/accounts/account-service";
import { createApiKey } from "@/core/security/api-keys";
import { getDb } from "@/db/client";
import { apiKeys } from "@/db/schema";

const createSchema = z.object({ name: z.string().trim().min(1).max(120), scopes: z.array(z.enum(["images:write", "images:read"])).min(1).default(["images:write"]) });
export async function GET() { const { userId } = await auth(); if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 }); const account = await ensureAccount(userId); const keys = await getDb().select({ id: apiKeys.id, name: apiKeys.name, prefix: apiKeys.prefix, scopes: apiKeys.scopes, lastUsedAt: apiKeys.lastUsedAt, createdAt: apiKeys.createdAt, expiresAt: apiKeys.expiresAt }).from(apiKeys).where(and(eq(apiKeys.accountId, account.id), isNull(apiKeys.revokedAt))); return Response.json({ data: keys }); }
export async function POST(request: Request) { const { userId } = await auth(); if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 }); const parsed = createSchema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 422 }); const account = await ensureAccount(userId); const key = createApiKey(); const [stored] = await getDb().insert(apiKeys).values({ accountId: account.id, name: parsed.data.name, prefix: key.prefix, secretHash: key.secretHash, scopes: parsed.data.scopes }).returning({ id: apiKeys.id, prefix: apiKeys.prefix, createdAt: apiKeys.createdAt }); return Response.json({ data: { ...stored, key: key.raw, scopes: parsed.data.scopes } }, { status: 201 }); }
