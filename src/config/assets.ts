export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  focal: `${number}% ${number}%`;
  lqip: string;
};

export type ImageSlot = ImageAsset & { slot: string; aspect: string };

const LQIP = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const mode = (import.meta.env.VITE_ASSET_MODE || 'placeholder') as 'local' | 'placeholder';

const placeholder = (slot: string, aspect: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#073B32"/><path d="M-100 700 500 100M200 900 800 300M500 900 1100 300M800 900 1400 300" stroke="#D6A62E" stroke-width="3" opacity=".28"/><circle cx="600" cy="330" r="90" fill="none" stroke="#D6A62E" stroke-width="2" opacity=".28"/><path d="M545 330h110M600 275v110" stroke="#D6A62E" stroke-width="2" opacity=".28"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const makeSlot = (slot: string, aspect: string, alt: string, width: number, height: number, focal = '50% 62%'): ImageSlot => ({
  slot,
  aspect,
  src: mode === 'local' ? `/images/${slot}` : placeholder(slot, aspect),
  alt,
  width,
  height,
  focal: focal as `${number}% ${number}%`,
  lqip: LQIP,
});

export const assets = {
  hero: [
    makeSlot('hero/hero-01.jpg', '3:2', 'Finished custom vehicle interior in workshop lighting', 2400, 1600),
    makeSlot('hero/hero-02.jpg', '3:2', 'Hand-stitched automotive upholstery detail', 2400, 1600),
    makeSlot('hero/hero-03.jpg', '3:2', 'Completed leather vehicle cabin', 2400, 1600),
  ],
  materials: [
    makeSlot('materials/material-01.jpg', '16:10', 'Close-up of genuine Nappa leather grain and stitching', 1200, 750),
    makeSlot('materials/material-02.jpg', '16:10', 'Close-up of full grain leather texture', 1200, 750),
    makeSlot('materials/material-03.jpg', '16:10', 'Close-up of heavy-duty vinyl texture', 1200, 750),
    makeSlot('materials/material-04.jpg', '16:10', 'Close-up of Alcantara and leather pairing', 1200, 750),
  ],
} as const;

const sourceToSlot: Record<string, ImageSlot> = {
  '/images/cushioning/cushioning-09.jpeg': assets.hero[0],
  '/images/steering/steering-09.jpg': assets.hero[1],
  '/images/cushioning/cushioning-15.jpeg': assets.hero[2],
  '/images/upholstery/upholstery-02.jpg': assets.materials[0],
  '/images/upholstery/upholstery-10.jpg': assets.materials[1],
  '/images/cushioning/cushioning-01.jpeg': assets.materials[2],
  '/images/upholstery/upholstery-06.jpg': assets.materials[3],
};

const fallbackSlots = ['services/service-01.jpg', 'portfolio/project-01-after.jpg', 'portfolio/project-01-before.jpg'];

export function resolveWebsiteAsset(source: string | undefined, alt: string, index = 0): ImageSlot {
  const subject = alt.toLowerCase();
  if (subject.includes('paint') || subject.includes('body work')) return { ...makeSlot('services/paint-booth.jpg', '4:3', alt, 1024, 768), src: '/images/services/paint-booth.jpg' };
  if (subject.includes('stitch') || subject.includes('steering')) return { ...makeSlot('services/stitching.jpg', '3:2', alt, 1012, 675), src: '/images/services/stitching.jpg' };
  if (subject.includes('cushion') || subject.includes('canvas') || subject.includes('shade') || subject.includes('tent')) return { ...makeSlot('services/stitching.jpg', '3:2', alt, 1012, 675), src: '/images/services/stitching.jpg' };
  if (subject.includes('seat') || subject.includes('upholstery') || subject.includes('leather') || subject.includes('interior')) return { ...makeSlot('services/leather-seats.jpg', '3:2', alt, 966, 641), src: '/images/services/leather-seats.jpg' };
  if (source && sourceToSlot[source]) return { ...sourceToSlot[source], alt };
  const slot = fallbackSlots[index % fallbackSlots.length];
  return makeSlot(slot, slot.includes('portfolio') ? '3:2' : '4:3', alt, slot.includes('portfolio') ? 1600 : 1600, slot.includes('portfolio') ? 1067 : 1200);
}

export function assetUrl(asset: ImageAsset): string { return asset.src; }
