export const compressionFormats = ["webp", "avif"] as const;
export type CompressionFormat = (typeof compressionFormats)[number];
export type CompressionRule = { mimeTypes?: string[]; extensions?: string[]; action: "skip" | "compress"; format?: CompressionFormat; quality?: number };
export type CompressionSettings = { enabled: boolean; defaultFormat: CompressionFormat; defaultQuality: number; maxWidth?: number; maxHeight?: number; rules: CompressionRule[] };
export type CompressionInput = { bytes: Uint8Array; contentType: string; sourceName?: string };
export type CompressionResult = CompressionInput & { compressed: boolean; originalByteSize: number };
export interface Compressor { compress(input: CompressionInput, settings: CompressionSettings): Promise<CompressionResult>; }
