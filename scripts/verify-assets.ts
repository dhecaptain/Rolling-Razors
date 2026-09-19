import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const assetFiles = [
  'hero/hero-01.jpg', 'hero/hero-02.jpg', 'hero/hero-03.jpg',
  'materials/material-01.jpg', 'materials/material-02.jpg', 'materials/material-03.jpg', 'materials/material-04.jpg',
];
const mode = process.env.VITE_ASSET_MODE || 'placeholder';

if (mode === 'placeholder') {
  console.log('Asset verification skipped: VITE_ASSET_MODE=placeholder (safe deploy placeholders enabled).');
  process.exit(0);
}

const missing = assetFiles.filter((file) => !fs.existsSync(path.join(root, 'public/images', file)));
if (missing.length) {
  console.error(`Missing required image assets:\n${missing.map((file) => `- public/images/${file}`).join('\n')}`);
  process.exit(1);
}
console.log(`Verified ${assetFiles.length} required image slots.`);
