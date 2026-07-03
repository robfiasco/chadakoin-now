// One-shot script: build a 1024x500 Play Store feature graphic.
// Run: node scripts/build-feature-graphic.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'store-assets', 'graphics', 'feature-graphic-1024x500.png');
const ICON_SRC = path.join(__dirname, '..', 'assets', 'files', 'icon-chadakoin.png');

const W = 1024, H = 500;
const ICON_SIZE = 280;
const ICON_X = 72;
const ICON_Y = (H - ICON_SIZE) / 2;

// Brand: dark bg with subtle radial highlight on the right; text on right of icon.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="78%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#1F5673" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="#0f0b08" stop-opacity="1"/>
      <stop offset="100%" stop-color="#0f0b08" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="#49D17D" stop-opacity="0"/>
      <stop offset="50%" stop-color="#49D17D" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#49D17D" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#0f0b08"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Title block, right of icon -->
  <text x="396" y="220"
        font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
        font-size="68" font-weight="800" fill="#ffffff"
        letter-spacing="-1.5">
    Chadakoin <tspan fill="#49D17D">Now</tspan>
  </text>

  <!-- Tagline -->
  <text x="398" y="266"
        font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
        font-size="18" font-weight="600" fill="rgba(255,255,255,0.55)"
        letter-spacing="3">
    JAMESTOWN, NY
  </text>

  <!-- Accent line -->
  <rect x="396" y="290" width="280" height="2" fill="url(#accentLine)"/>

  <!-- Subtitle -->
  <text x="396" y="332"
        font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
        font-size="20" font-weight="500" fill="rgba(255,255,255,0.78)">
    Recycling. Parking. News. Events.
  </text>
  <text x="396" y="362"
        font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
        font-size="20" font-weight="500" fill="rgba(255,255,255,0.78)">
    Where to eat. Where to stay.
  </text>
</svg>
`.trim();

async function main() {
  const iconBuf = await sharp(ICON_SRC).resize(ICON_SIZE, ICON_SIZE).toBuffer();

  await sharp(Buffer.from(svg))
    .composite([{ input: iconBuf, left: ICON_X, top: Math.round(ICON_Y) }])
    .png()
    .toFile(OUT);

  const stat = fs.statSync(OUT);
  console.log(`Wrote ${OUT} (${(stat.size / 1024).toFixed(1)} KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
