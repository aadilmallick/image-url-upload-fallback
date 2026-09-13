export default class ClipboardModel {
  static async readText() { try { return await navigator.clipboard.readText(); } catch { return null; } }
  static async readClipboardDataAsText() { try { const [item] = await navigator.clipboard.read(); return item?.types.includes("text/plain") ? (await item.getType("text/plain")).text() : null; } catch { return null; } }
  static async readClipboardDataAsHTML() { try { const [item] = await navigator.clipboard.read(); return item?.types.includes("text/html") ? (await item.getType("text/html")).text() : null; } catch { return null; } }
  static async readClipboardDataAsImage(options?: { asBlob?: boolean }) { try { const [item] = await navigator.clipboard.read(); const mimeType = item?.types.find((type) => type.startsWith("image/")); if (!item || !mimeType) return null; const blob = await item.getType(mimeType); return options?.asBlob ? blob : URL.createObjectURL(blob); } catch { return null; } }
  static async copyText(text: string) { await navigator.clipboard.writeText(text); }
  static async hasTextCopied() { try { const [item] = await navigator.clipboard.read(); return Boolean(item?.types.some((type) => type.startsWith("text/"))); } catch { return false; } }
  static async hasImageCopied() { try { const [item] = await navigator.clipboard.read(); return Boolean(item?.types.some((type) => type.startsWith("image/"))); } catch { return false; } }
}
