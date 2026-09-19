import * as THREE from 'three';

export type StitchPattern = 'diamond' | 'perforated' | 'pleats' | 'double';
export type LeatherType = 'nappa' | 'full-grain' | 'vinyl' | 'alcantara';

export type LeatherTokens = {
  roughness: number;
  bumpScale: number;
  clearcoat: number;
  grain: number;
};

export const LEATHER_TOKENS: Record<LeatherType, LeatherTokens> = {
  nappa: { roughness: 0.42, bumpScale: 0.02, clearcoat: 0.35, grain: 0.45 },
  'full-grain': { roughness: 0.58, bumpScale: 0.055, clearcoat: 0.12, grain: 1 },
  vinyl: { roughness: 0.2, bumpScale: 0.014, clearcoat: 0.85, grain: 0.2 },
  alcantara: { roughness: 0.92, bumpScale: 0.09, clearcoat: 0, grain: 1.5 },
};

const SIZE = 512;
const GOLD: [number, number, number] = [214, 166, 46];

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function shade(rgb: RGB, t: number, towardWhite = false): RGB {
  const target: RGB = towardWhite ? [255, 255, 255] : [0, 0, 0];
  return [mix(rgb[0], target[0], t), mix(rgb[1], target[1], t), mix(rgb[2], target[2], t)];
}

function css(rgb: RGB, alpha = 1): string {
  return `rgba(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0}, ${alpha})`;
}

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  return [canvas, canvas.getContext('2d') as CanvasRenderingContext2D];
}

function paintLeatherGrain(ctx: CanvasRenderingContext2D, rgb: RGB, strength: number): void {
  const rng = seededRng(2026);
  const passes = Math.round(4200 * strength);
  for (let i = 0; i < passes; i += 1) {
    const x = rng() * SIZE;
    const y = rng() * SIZE;
    const light = rng() > 0.5;
    const alpha = 0.03 + rng() * 0.05;
    ctx.fillStyle = css(light ? shade(rgb, 0.14, true) : shade(rgb, 0.16), alpha);
    ctx.fillRect(x, y, 1.4, 1.4);
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, rgb: RGB): void {
  const cols = SIZE / 128;
  const rows = SIZE / 128;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cx = (c + 0.5) * 128;
      const cy = (r + 0.5) * 128;
      const halfW = 46;
      const halfH = 58;
      const top = [cx, cy - halfH] as const;
      const right = [cx + halfW, cy] as const;
      const bottom = [cx, cy + halfH] as const;
      const left = [cx - halfW, cy] as const;
      ctx.fillStyle = css(shade(rgb, 0.12));
      ctx.beginPath();
      ctx.moveTo(top[0], top[1]);
      ctx.lineTo(right[0], right[1]);
      ctx.lineTo(bottom[0], bottom[1]);
      ctx.lineTo(left[0], left[1]);
      ctx.closePath();
      ctx.fill();
      const highlight = ctx.createLinearGradient(top[0], top[1], bottom[0], bottom[1]);
      highlight.addColorStop(0, css(shade(rgb, 0.04, true)));
      highlight.addColorStop(0.55, 'rgba(0,0,0,0)');
      highlight.addColorStop(1, css(shade(rgb, 0.05, false), 0.6));
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.moveTo(top[0], top[1]);
      ctx.lineTo(right[0], right[1]);
      ctx.lineTo(bottom[0], bottom[1]);
      ctx.lineTo(left[0], left[1]);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = css(GOLD);
  for (let r = 0; r <= rows; r += 1) {
    for (let c = 0; c <= cols; c += 1) {
      const x = c * 128;
      const y = r * 128;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 64, y + 64, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPerforated(ctx: CanvasRenderingContext2D, rgb: RGB): void {
  const step = 64;
  for (let r = 0; r < SIZE / step; r += 1) {
    for (let c = 0; c < SIZE / step; c += 1) {
      const x = (c + (r % 2 ? 0.5 : 0)) * step;
      const y = r * step;
      const hole = ctx.createRadialGradient(x, y, 1, x, y, step * 0.32);
      hole.addColorStop(0, css(shade(rgb, 0.34)));
      hole.addColorStop(0.5, css(shade(rgb, 0.14)));
      hole.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hole;
      ctx.beginPath();
      ctx.arc(x, y, step * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = css(GOLD);
  for (let r = 0; r <= SIZE / step; r += 1) {
    for (let c = 0; c <= SIZE / step; c += 1) {
      const x = c * step;
      const y = r * step;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPleats(ctx: CanvasRenderingContext2D, rgb: RGB): void {
  const width = 128;
  for (let i = 0; i < SIZE / width; i += 1) {
    const x = i * width;
    const ridge = ctx.createLinearGradient(x, 0, x + width, 0);
    ridge.addColorStop(0, css(shade(rgb, 0.12)));
    ridge.addColorStop(0.22, css(shade(rgb, 0.02, true)));
    ridge.addColorStop(0.78, css(shade(rgb, 0.03, true)));
    ridge.addColorStop(1, css(shade(rgb, 0.14)));
    ctx.fillStyle = ridge;
    ctx.fillRect(x, 0, width, SIZE);
  }
  ctx.fillStyle = css(GOLD);
  for (let i = 0; i <= SIZE / width; i += 1) {
    const x = i * width;
    ctx.fillRect(x - 1.2, 0, 2.4, SIZE);
  }
}

function drawDoubleStitch(ctx: CanvasRenderingContext2D, rgb: RGB): void {
  const width = 128;
  const pairGap = 7;
  for (let i = 0; i < SIZE / width; i += 1) {
    const x = i * width;
    ctx.fillStyle = css(shade(rgb, 0.07));
    ctx.fillRect(x, 0, width, SIZE);
  }
  ctx.fillStyle = css(shade(rgb, 0.035), 0.4);
  for (let i = 0; i < 10; i += 1) {
    ctx.fillStyle = css(i % 2 ? shade(rgb, 0.05, true) : shade(rgb, 0.09), 0.35);
    ctx.fillRect(0, (i + 0.5) * (SIZE / 10), SIZE, SIZE / 10);
  }
  ctx.fillStyle = css(GOLD);
  for (let i = 0; i < SIZE / width; i += 1) {
    const x = i * width;
    ctx.fillRect(x + width / 2 - pairGap, 0, 1.6, SIZE);
    ctx.fillRect(x + width / 2 + pairGap, 0, 1.6, SIZE);
  }
}

function drawPattern(ctx: CanvasRenderingContext2D, rgb: RGB, pattern: StitchPattern): void {
  switch (pattern) {
    case 'diamond':
      drawDiamond(ctx, rgb);
      break;
    case 'perforated':
      drawPerforated(ctx, rgb);
      break;
    case 'pleats':
      drawPleats(ctx, rgb);
      break;
    case 'double':
      drawDoubleStitch(ctx, rgb);
      break;
  }
}

export function makeQuiltingTexture(options: {
  primary: string;
  pattern: StitchPattern;
  grain: number;
}): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas();
  const rgb = hexToRgb(options.primary);
  ctx.fillStyle = css(rgb);
  ctx.fillRect(0, 0, SIZE, SIZE);
  paintLeatherGrain(ctx, rgb, options.grain);
  drawPattern(ctx, rgb, options.pattern);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function makeBumpTexture(options: {
  primary: string;
  pattern: StitchPattern;
}): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas();
  const rgb = hexToRgb(options.primary);
  ctx.fillStyle = '#7f7f7f';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const gb = (amount: number, direction: -1 | 1): string =>
    `rgba(${128 + direction * amount | 0}, ${128 + direction * amount | 0}, ${128 + direction * amount | 0}, 1)`;
  if (options.pattern === 'diamond') {
    for (let r = 0; r < SIZE / 128; r += 1) {
      for (let c = 0; c < SIZE / 128; c += 1) {
        const cx = (c + 0.5) * 128;
        const cy = (r + 0.5) * 128;
        const top = [cx, cy - 58] as const;
        const right = [cx + 46, cy] as const;
        const bottom = [cx, cy + 58] as const;
        const left = [cx - 46, cy] as const;
        ctx.fillStyle = gb(38, 1);
        ctx.beginPath();
        ctx.moveTo(top[0], top[1]);
        ctx.lineTo(right[0], right[1]);
        ctx.lineTo(bottom[0], bottom[1]);
        ctx.lineTo(left[0], left[1]);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (options.pattern === 'perforated') {
    for (let r = 0; r < SIZE / 64; r += 1) {
      for (let c = 0; c < SIZE / 64; c += 1) {
        const x = (c + (r % 2 ? 0.5 : 0)) * 64;
        const y = r * 64;
        const hole = ctx.createRadialGradient(x, y, 1, x, y, 18);
        hole.addColorStop(0, '#3c3c3c');
        hole.addColorStop(0.5, '#5c5c5c');
        hole.addColorStop(1, '#7f7f7f');
        ctx.fillStyle = hole;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (options.pattern === 'pleats') {
    for (let i = 0; i < SIZE / 128; i += 1) {
      const x = i * 128;
      const ridge = ctx.createLinearGradient(x, 0, x + 128, 0);
      ridge.addColorStop(0, '#a8a8a8');
      ridge.addColorStop(0.5, '#6a6a6a');
      ridge.addColorStop(1, '#a8a8a8');
      ctx.fillStyle = ridge;
      ctx.fillRect(x, 0, 128, SIZE);
    }
  } else {
    for (let i = 0; i < SIZE / 64; i += 1) {
      ctx.fillStyle = i % 2 ? '#7f7f7f' : '#8a8a8a';
      ctx.fillRect(0, i * 64, SIZE, 64);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function makeShadowDisc(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.42)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.2)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}