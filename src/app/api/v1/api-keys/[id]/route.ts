import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { ensureAccount } from "@/core/accounts/account-service";
import { getDb } from "@/db/client";
import { apiKeys } from "@/db/schema";
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { const { userId } = await auth(); if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 }); const account = await ensureAccount(userId); const { id } = await params; const [revoked] = await getDb().update(apiKeys).set({ revokedAt: new Date() }).where(and(eq(apiKeys.id, id), eq(apiKeys.accountId, account.id), isNull(apiKeys.revokedAt))).returning({ id: apiKeys.id }); return revoked ? new Response(null, { status: 204 }) : Response.json({ error: "Not found" }, { status: 404 }); }
