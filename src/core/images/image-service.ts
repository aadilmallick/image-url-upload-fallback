import { createHash, randomBytes } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { decryptCredentials } from "@/core/security/credentials";
import { createProvider } from "@/core/providers/provider-factory";
import { LinkProvider } from "@/core/providers/link-provider";
import { SharpCompressor } from "@/core/compression/sharp-compressor";
import { CompressionSettings } from "@/core/compression/types";
import { inngest } from "@/inngest/client";
import { UploadOrchestrator } from "./upload-orchestrator";
import { LoadedImage } from "./source-loader";
import { getDb } from "@/db/client";
import { compressionSettings, fallbackChainItems, imageEvents, imageReplicas, images, providerConnections, shortLinks } from "@/db/schema";

export async function createImage(accountId: string, input: LoadedImage) {
  const db = getDb();
  const storedSettings = await db.query.compressionSettings.findFirst({ where: eq(compressionSettings.accountId, accountId) });
  const settings: CompressionSettings = storedSettings ? { enabled: storedSettings.enabled, ...storedSettings.config } : { enabled: false, defaultFormat: "webp", defaultQuality: 80, rules: [] };
  const processed = await new SharpCompressor().compress({ bytes: input.bytes, contentType: input.contentType, sourceName: input.sourceName }, settings);
  const processedHash = createHash("sha256").update(processed.bytes).digest("hex");
  const [created] = await db.insert(images).values({ accountId, originalUrl: input.originalUrl, contentType: processed.contentType, byteSize: processed.bytes.byteLength, sha256: processedHash, status: "processing" }).returning();
  const chain = await db.select().from(fallbackChainItems).where(eq(fallbackChainItems.accountId, accountId)).orderBy(asc(fallbackChainItems.position));
  const connections = await db.select().from(providerConnections).where(eq(providerConnections.accountId, accountId));
  const selected = chain.filter((item) => item.provider !== "link").map((item) => connections.find((connection) => connection.provider === item.provider && connection.enabled)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (!selected.length) { await db.update(images).set({ status: "failed" }).where(eq(images.id, created.id)); throw new Error("Connect and enable at least one storage provider in your fallback chain."); }
  const extension = processed.contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin";
  const uploadInput = { bytes: processed.bytes, contentType: processed.contentType, objectKey: `${accountId}/${processedHash}.${extension}`, sourceUrl: input.originalUrl };
  const storageResult = await new UploadOrchestrator().replicate(uploadInput, selected.map((connection) => createProvider(connection.provider, decryptCredentials(connection.encryptedCredentials))));
  const linkReplica = input.originalUrl ? await new LinkProvider().upload(uploadInput).then((result) => ({ provider: "link" as const, status: "ready" as const, result })) : undefined;
  const replicas = linkReplica ? [linkReplica, ...storageResult.replicas] : storageResult.replicas;
  const ready = replicas.filter((replica) => replica.status === "ready");
  await db.insert(imageReplicas).values(replicas.map((replica) => ({ imageId: created.id, provider: replica.provider, status: replica.status, externalId: replica.result?.externalId, providerUrl: replica.result?.publicUrl, failureReason: "error" in replica ? replica.error : undefined })));
  if (!ready.some((replica) => replica.provider !== "link")) { await db.update(images).set({ status: "failed" }).where(eq(images.id, created.id)); throw new Error("Every managed storage provider upload failed."); }
  const status = storageResult.status;
  const code = randomBytes(7).toString("base64url");
  await db.update(images).set({ status }).where(eq(images.id, created.id));
  await db.insert(imageEvents).values({ imageId: created.id, type: status === "degraded" ? "degraded" : "uploaded", message: status === "degraded" ? "At least one replica failed; repair scheduled." : processed.compressed ? `Compressed from ${processed.originalByteSize} to ${processed.bytes.byteLength} bytes before replication.` : "All replicas uploaded." });
  if (status === "degraded") void inngest.send({ name: "image/repair.requested", data: { imageId: created.id } }).catch(() => undefined);
  const [link] = await db.insert(shortLinks).values({ imageId: created.id, code }).returning();
  return { image: created, status, shortCode: link.code, replicas: ready };
}
