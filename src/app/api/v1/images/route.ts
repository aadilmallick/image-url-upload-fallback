import { z } from "zod";
import { authenticateRequest } from "@/core/auth/request-auth";
import { createImage } from "@/core/images/image-service";
import { loadImageFromFile, loadImageFromUrl } from "@/core/images/source-loader";
import { getConfig } from "@/core/config";
import { enforceUploadAllowance } from "@/core/billing/entitlements";
const bodySchema = z.object({ sourceUrl: z.string().url() });
export async function POST(request: Request) { const account = await authenticateRequest(request, "images:write"); if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 }); try { await enforceUploadAllowance(account.id); const type = request.headers.get("content-type") ?? ""; const loaded = type.includes("multipart/form-data") ? await loadImageFromFile((await request.formData()).get("file") as File) : await loadImageFromUrl(bodySchema.parse(await request.json()).sourceUrl); const result = await createImage(account.id, loaded); return Response.json({ data: { id: result.image.id, status: result.status, shortlink: new URL(`/i/${result.shortCode}`, getConfig().NEXT_PUBLIC_APP_URL).toString(), originalUrl: loaded.originalUrl ?? null, providers: Object.fromEntries(result.replicas.map((item) => [item.provider, item.result?.publicUrl])) } }, { status: 201 }); } catch (error) { const message = error instanceof Error ? error.message : "Upload failed"; return Response.json({ error: message }, { status: /tier|limit/i.test(message) ? 429 : 422 }); } }
