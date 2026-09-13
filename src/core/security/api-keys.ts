import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
export type NewApiKey = { raw: string; prefix: string; secretHash: string };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function createApiKey(): NewApiKey { const prefix = `imf_${randomBytes(5).toString("hex")}`; const raw = `${prefix}_${randomBytes(32).toString("base64url")}`; return { raw, prefix, secretHash: hash(raw) }; }
export function verifyApiKey(raw: string, storedHash: string) { const actual = Buffer.from(hash(raw), "hex"); const expected = Buffer.from(storedHash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }
