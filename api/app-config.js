import { noticesHandler } from './_notices.js';

// Minimum native app version — bump MIN_VERSION and deploy to force anyone
// on an older build to update before they can keep using the app. Web is
// never gated by this (every visit already serves the latest deployment).
const MIN_VERSION = '1.6.5';

const STORE_URLS = {
  ios: 'https://apps.apple.com/app/id6783802593',
  android: 'https://play.google.com/store/apps/details?id=com.chadakoinnow',
};

export default function handler(req, res) {
  // /api/notices is rewritten here (see _notices.js for why).
  if (req.query?.view === 'notices') return noticesHandler(req, res);
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  res.status(200).json({ minVersion: MIN_VERSION, storeUrls: STORE_URLS });
}
