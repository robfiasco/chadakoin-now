// Resize existing phone screenshots to iOS App Store required dimensions.
// Scales to fit within the target, centers on brand-color background.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'store-assets', 'screenshots');
const OUT_DIR = path.join(__dirname, '..', 'store-assets', 'screenshots');
const BG = { r: 15, g: 11, b: 8, alpha: 1 }; // #0f0b08

const SIZES = {
  'ios-69': { w: 1320, h: 2868 }, // iPhone 6.9" (16 Pro Max / 17 Pro Max)
  'ios-67': { w: 1290, h: 2796 }, // iPhone 6.7" (14 Pro Max / 15 Pro Max)
  'ios-65': { w: 1242, h: 2688 }, // iPhone 6.5" (XS Max / 11 Pro Max)
};

const FILES = [
  '01-home.jpg',
  '02-sports.jpg',
  '03-news.jpg',
  '04-events.jpg',
  '05-visit.jpg',
];

async function resize(inputPath, outPath, target) {
  const img = sharp(inputPath);
  const meta = await img.metadata();

  const scale = Math.min(target.w / meta.width, target.h / meta.height);
  const scaledW = Math.round(meta.width * scale);
  const scaledH = Math.round(meta.height * scale);

  const resized = await img.resize(scaledW, scaledH).toBuffer();

  await sharp({ create: { width: target.w, height: target.h, channels: 4, background: BG } })
    .composite([{ input: resized, left: Math.round((target.w - scaledW) / 2), top: Math.round((target.h - scaledH) / 2) }])
    .png()
    .toFile(outPath);
}

async function main() {
  for (const [label, target] of Object.entries(SIZES)) {
    const dir = path.join(OUT_DIR, label);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of FILES) {
      const outName = f.replace(/\.jpg$/i, '.png');
      const out = path.join(dir, outName);
      await resize(path.join(SRC_DIR, f), out, target);
      console.log(`  ${label}/${outName}`);
    }
  }
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
