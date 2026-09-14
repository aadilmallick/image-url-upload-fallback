import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { ensureAccount } from "@/core/accounts/account-service";
import { getDb } from "@/db/client";
import { compressionSettings } from "@/db/schema";
const ruleSchema = z.object({ mimeTypes: z.array(z.string().startsWith("image/")).max(10).optional(), extensions: z.array(z.string().regex(/^\.[a-z0-9]+$/i)).max(10).optional(), action: z.enum(["skip", "compress"]), format: z.enum(["webp", "avif"]).optional(), quality: z.number().int().min(1).max(100).optional() });
const schema = z.object({ enabled: z.boolean(), defaultFormat: z.enum(["webp", "avif"]).default("webp"), defaultQuality: z.number().int().min(1).max(100).default(80), maxWidth: z.number().int().min(1).max(16_000).optional(), maxHeight: z.number().int().min(1).max(16_000).optional(), rules: z.array(ruleSchema).max(20).default([]) });
const defaults = { enabled: false, defaultFormat: "webp" as const, defaultQuality: 80, rules: [] };
export async function GET() { const { userId } = await auth(); if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 }); const account = await ensureAccount(userId); const data = await getDb().query.compressionSettings.findFirst({ where: eq(compressionSettings.accountId, account.id) }); return Response.json({ data: data ? { enabled: data.enabled, ...data.config } : defaults }); }
export async function PUT(request: Request) { const { userId } = await auth(); if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Invalid compression settings", details: parsed.error.flatten() }, { status: 422 }); const account = await ensureAccount(userId); const { enabled, ...config } = parsed.data; await getDb().insert(compressionSettings).values({ accountId: account.id, enabled, config }).onConflictDoUpdate({ target: compressionSettings.accountId, set: { enabled, config, updatedAt: new Date() } }); return Response.json({ data: parsed.data }); }
