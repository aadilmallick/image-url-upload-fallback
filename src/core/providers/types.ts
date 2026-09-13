export const providerTypes = ["link", "cloudinary", "imagekit", "s3", "firebase"] as const;
export const connectionProviderTypes = ["cloudinary", "imagekit", "s3", "firebase"] as const;
export type ProviderType = (typeof providerTypes)[number];
export type ProviderHealth = "healthy" | "missing" | "unavailable";
export type UploadInput = { bytes: Uint8Array; contentType: string; objectKey: string; sourceUrl?: string };
export type UploadResult = { externalId: string; publicUrl: string };
export interface ImageProvider<TCredentials = unknown> { readonly type: ProviderType; validateCredentials(credentials: TCredentials): Promise<void>; upload(input: UploadInput): Promise<UploadResult>; check(url: string): Promise<ProviderHealth>; }
