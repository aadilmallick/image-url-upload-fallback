import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { ensureAccount } from "@/core/accounts/account-service";
import { getDb } from "@/db/client";
import { imageReplicas, images, shortLinks } from "@/db/schema";
const escape = (value: string | null) => `"${(value ?? "").replaceAll('"', '""')}"`;
export async function GET() { const { userId } = await auth(); if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 }); const account = await ensureAccount(userId); const rows = await getDb().select({ code: shortLinks.code, originalUrl: images.originalUrl, provider: imageReplicas.provider, providerUrl: imageReplicas.providerUrl, status: images.status }).from(shortLinks).innerJoin(images, eq(shortLinks.imageId, images.id)).leftJoin(imageReplicas, eq(imageReplicas.imageId, images.id)).where(eq(images.accountId, account.id)); const csv = ["short_code,status,original_url,provider,provider_url", ...rows.map((row) => [row.code, row.status, row.originalUrl, row.provider, row.providerUrl].map(escape).join(","))].join("\n"); return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=image-fallback-links.csv" } }); }
