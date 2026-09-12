type Opts = { w?: number; h?: number; q?: number };

export function cdnUrl(src: string, opts: Opts = {}): string {
  if (!src) return src;
  const { w = 800, q = 80 } = opts;
  const cdnBase = (import.meta as any).env?.VITE_IMAGE_CDN_URL as string | undefined;
  if (cdnBase) {
    try {
      const url = new URL(src);
      const cdnHost = new URL(cdnBase).hostname;
      if (url.hostname !== cdnHost) {
        return `${cdnBase.replace(/\/$/, "")}/${encodeURIComponent(src)}?w=${w}&q=${q}`;
      }
    } catch {}
  }
  return src;
}

export function srcSet(src: string, widths = [400, 800, 1200]): string {
  return widths.map(w => `${cdnUrl(src, { w })} ${w}w`).join(", ");
}
