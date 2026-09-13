import { BaseImageProvider } from "./base-provider";
import { UploadInput, UploadResult } from "./types";
/** A per-image provider that preserves a user-owned source URL as the first delivery candidate. */
export class LinkProvider extends BaseImageProvider<Record<string, never>> { readonly type = "link" as const; async validateCredentials() {} async upload(input: UploadInput): Promise<UploadResult> { if (!input.sourceUrl) throw new Error("LinkProvider requires an image source URL."); return { externalId: input.sourceUrl, publicUrl: input.sourceUrl }; } }
