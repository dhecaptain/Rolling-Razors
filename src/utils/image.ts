type Opts = { w?: number; h?: number; q?: number; auto?: boolean };

export function cdnUrl(src: string, opts: Opts = {}): string {
  if (!src) return src;
  const { w = 800, q = 80, auto = true } = opts;
  try {
    const url = new URL(src);
    if (url.hostname.includes("images.unsplash.com")) {
      if (auto && !url.searchParams.has("auto")) url.searchParams.set("auto", "format");
      if (!url.searchParams.has("q")) url.searchParams.set("q", String(q));
      if (!url.searchParams.has("w")) url.searchParams.set("w", String(w));
      if (!url.searchParams.has("fit")) url.searchParams.set("fit", "crop");
      return url.toString();
    }
    const cdnBase = (import.meta as any).env?.VITE_IMAGE_CDN_URL as string | undefined;
    if (cdnBase && url.hostname !== new URL(cdnBase).hostname) {
      return `${cdnBase.replace(/\/$/, "")}/${encodeURIComponent(src)}?w=${w}&q=${q}`;
    }
    return src;
  } catch {
    return src;
  }
}

export function srcSet(src: string, widths = [400, 800, 1200]): string {
  return widths.map(w => `${cdnUrl(src, { w })} ${w}w`).join(", ");
}
