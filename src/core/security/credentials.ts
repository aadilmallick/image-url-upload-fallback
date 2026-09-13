import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getConfig } from "@/core/config";
const algorithm = "aes-256-gcm";
function key() { const value = Buffer.from(getConfig().CREDENTIAL_ENCRYPTION_KEY, "base64"); if (value.length !== 32) throw new Error("CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes"); return value; }
export function encryptCredentials(value: unknown) { const iv = randomBytes(12); const cipher = createCipheriv(algorithm, key(), iv); const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]); const tag = cipher.getAuthTag(); return Buffer.concat([iv, tag, data]).toString("base64"); }
export function decryptCredentials<T>(ciphertext: string): T { const payload = Buffer.from(ciphertext, "base64"); const decipher = createDecipheriv(algorithm, key(), payload.subarray(0, 12)); decipher.setAuthTag(payload.subarray(12, 28)); const data = Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]); return JSON.parse(data.toString("utf8")) as T; }
