import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { CompressionFormat, CompressionInput, CompressionResult, CompressionSettings, Compressor } from "./types";
const mimeByFormat: Record<CompressionFormat, string> = { webp: "image/webp", avif: "image/avif" };
function extension(input: CompressionInput) { const part = input.sourceName?.split(/[?#]/)[0].split(".").at(-1)?.toLowerCase(); return part && part !== input.sourceName ? `.${part}` : undefined; }
function matchingRule(input: CompressionInput, settings: CompressionSettings) { const ext = extension(input); return settings.rules.find((rule) => (!rule.mimeTypes?.length || rule.mimeTypes.includes(input.contentType)) && (!rule.extensions?.length || Boolean(ext && rule.extensions.map((value) => value.toLowerCase()).includes(ext)))); }
export class SharpCompressor implements Compressor {
  async compress(input: CompressionInput, settings: CompressionSettings): Promise<CompressionResult> {
    const rule = matchingRule(input, settings);
    if (!settings.enabled || rule?.action === "skip" || input.contentType === "image/svg+xml" || input.contentType === "image/gif") return { ...input, compressed: false, originalByteSize: input.bytes.byteLength };
    const format = rule?.format ?? settings.defaultFormat;
    const quality = Math.min(100, Math.max(1, rule?.quality ?? settings.defaultQuality));
    const transformer = sharp(Buffer.from(input.bytes), { animated: false, limitInputPixels: 40_000_000 }).rotate().resize({ width: settings.maxWidth, height: settings.maxHeight, fit: "inside", withoutEnlargement: true });
    const output = format === "avif" ? await transformer.avif({ quality, effort: 4 }).toBuffer() : await transformer.webp({ quality, effort: 4 }).toBuffer();
    return { bytes: new Uint8Array(output), contentType: mimeByFormat[format], sourceName: input.sourceName, compressed: true, originalByteSize: input.bytes.byteLength };
  }
}
export function compressionObjectSuffix(input: CompressionResult) { return input.compressed ? createHash("sha256").update(input.bytes).digest("hex") : undefined; }
