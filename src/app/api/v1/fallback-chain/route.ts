import { auth } from "@clerk/nextjs/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { ensureAccount } from "@/core/accounts/account-service";
import { validateFallbackChain } from "@/core/images/chain-policy";
import { providerTypes } from "@/core/providers/types";
import { getDb } from "@/db/client";
import { fallbackChainItems, providerConnections } from "@/db/schema";
const schema = z.object({ providers: z.array(z.enum(providerTypes)).min(1) });
export async function GET() { const { userId } = await auth(); if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 }); const account = await ensureAccount(userId); const data = await getDb().select({ provider: fallbackChainItems.provider, position: fallbackChainItems.position }).from(fallbackChainItems).where(eq(fallbackChainItems.accountId, account.id)).orderBy(asc(fallbackChainItems.position)); return Response.json({ data }); }
export async function PUT(request: Request) { const { userId } = await auth(); if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 422 }); const account = await ensureAccount(userId); const db = getDb(); const connections = await db.select({ provider: providerConnections.provider }).from(providerConnections).where(eq(providerConnections.accountId, account.id)); try { validateFallbackChain(parsed.data.providers, new Set(connections.map((item) => item.provider))); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid chain" }, { status: 422 }); } await db.transaction(async (tx) => { await tx.delete(fallbackChainItems).where(eq(fallbackChainItems.accountId, account.id)); await tx.insert(fallbackChainItems).values(parsed.data.providers.map((provider, position) => ({ accountId: account.id, provider, position }))); }); return Response.json({ data: parsed.data.providers }); }
