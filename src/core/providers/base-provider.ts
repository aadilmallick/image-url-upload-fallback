import { ImageProvider, ProviderHealth } from "./types";
export abstract class BaseImageProvider<TCredentials> implements ImageProvider<TCredentials> {
  abstract readonly type: ImageProvider<TCredentials>["type"];
  abstract validateCredentials(credentials: TCredentials): Promise<void>;
  abstract upload(input: Parameters<ImageProvider<TCredentials>["upload"]>[0]): ReturnType<ImageProvider<TCredentials>["upload"]>;
  async check(url: string): Promise<ProviderHealth> { try { let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(4_000) }); if (response.status === 405 || response.status === 501) response = await fetch(url, { headers: { Range: "bytes=0-0" }, redirect: "follow", signal: AbortSignal.timeout(4_000) }); if (response.status === 404 || response.status === 410) return "missing"; return response.ok || response.status === 206 ? "healthy" : "unavailable"; } catch { return "unavailable"; } }
}
