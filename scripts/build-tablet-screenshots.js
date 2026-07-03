// One-shot: take phone screenshots and frame them on a 9:16 tablet-shaped
// canvas with brand-color padding. Output two sets (7" and 10") to satisfy
// Play Console form-factor requirements.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'store-assets', 'screenshots');
const OUT_DIR = SRC_DIR;
const BG = { r: 15, g: 11, b: 8, alpha: 1 }; // #0f0b08

const SIZES = {
  '7in':  { w: 1080, h: 1920 },
  '10in': { w: 1620, h: 2880 },
};

const FILES = [
  '01-home.png',
  '02-sports.png',
  '03-news.png',
  '04-events.png',
  '05-visit.png',
];

async function frame(inputPath, outPath, target) {
  const img = sharp(inputPath);
  const meta = await img.metadata();

  // Scale phone shot to fit the canvas height with margin, preserve aspect ratio.
  const margin = Math.round(target.h * 0.06);
  const phoneTargetH = target.h - margin * 2;
  const phoneTargetW = Math.round(meta.width * (phoneTargetH / meta.height));

  const phoneBuf = await img.resize(phoneTargetW, phoneTargetH).toBuffer();

  await sharp({
    create: {
      width: target.w,
      height: target.h,
      channels: 4,
      background: BG,
    },
  })
    .composite([{
      input: phoneBuf,
      left: Math.round((target.w - phoneTargetW) / 2),
      top: margin,
    }])
    .png()
    .toFile(outPath);
}

async function main() {
  for (const [label, target] of Object.entries(SIZES)) {
    const dir = path.join(OUT_DIR, `tablet-${label}`);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of FILES) {
      const out = path.join(dir, f);
      await frame(path.join(SRC_DIR, f), out, target);
      console.log(`  ${label}/${f}`);
    }
  }
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
