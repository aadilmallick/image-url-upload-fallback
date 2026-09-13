import { z } from "zod";
export const MAX_IMAGE_BYTES = 1_000_000;
export const sourceUrlSchema = z.object({ sourceUrl: z.string().url().max(2_048) });
export function assertImage(file: File) { if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 1 MB or smaller."); if (!file.type.startsWith("image/")) throw new Error("Only image files are accepted."); }
