import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '../public');

// Fetch Cormorant Garamond Medium TTF from Google Fonts and embed as base64
async function getFontBase64() {
  try {
    // Google Fonts CSS to get the actual font file URL
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    ).then(r => r.text());
    const urlMatch = css.match(/src: url\(([^)]+\.ttf)\)/);
    const woffMatch = css.match(/src: url\(([^)]+)\) format\('woff2'\)/);
    const fontUrl = (woffMatch || urlMatch)?.[1];
    if (!fontUrl) throw new Error('font URL not found');
    const buf = Buffer.from(await fetch(fontUrl).then(r => r.arrayBuffer()));
    return buf.toString('base64');
  } catch (e) {
    console.warn('Could not fetch Cormorant Garamond, falling back to system serif:', e.message);
    return null;
  }
}

function buildSvg(size, includeRoundedCorners, fontB64) {
  const rx = includeRoundedCorners ? Math.round(size * 0.22) : 0;
  const fontSize = Math.round(size * 0.575);
  const cX = Math.round(size * 0.29);
  const nX = Math.round(size * 0.71);
  const y = Math.round(size * 0.66);
  const fontFamily = 'Cormorant Garamond, Garamond, Georgia, serif';

  const fontFace = fontB64
    ? `<defs><style>@font-face{font-family:'Cormorant Garamond';font-weight:500;src:url('data:font/truetype;base64,${fontB64}') format('truetype');}</style></defs>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${fontFace}
  <rect width="${size}" height="${size}" rx="${rx}" fill="#0f0b08"/>
  <text x="${cX}" y="${y}" text-anchor="middle"
    font-family="${fontFamily}"
    font-size="${fontSize}" font-weight="500" fill="#4a6fa5">C</text>
  <text x="${nX}" y="${y}" text-anchor="middle"
    font-family="${fontFamily}"
    font-size="${fontSize}" font-weight="500" fill="#d1d5db">N</text>
</svg>`;
}

async function generate() {
  const fontB64 = await getFontBase64();

  // apple-touch-icon: 1024x1024, no rounded corners (iOS masks it)
  const touchSvg = buildSvg(1024, false, fontB64);
  await sharp(Buffer.from(touchSvg))
    .png()
    .toFile(join(PUBLIC, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (1024x1024)');

  // favicon: 192x192 (manifest icon)
  const faviconSvg = buildSvg(192, false, fontB64);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(join(PUBLIC, 'favicon.png'));
  console.log('✓ favicon.png (192x192)');

  writeFileSync(join(PUBLIC, 'icon-preview.svg'), buildSvg(200, true, null));
  console.log('✓ icon-preview.svg (for visual check)');
}

generate().catch(console.error);
