// Vercel serverless function — CORS proxy for RSS/JSON feeds
// Keeps browser CORS restrictions from blocking civic data fetches on web.

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url param');

  try {
    const upstream = await fetch(decodeURIComponent(url), {
      headers: {
        'User-Agent': 'ChadakoinNow/1.0',
        'Accept': 'application/rss+xml, application/xml, application/json, text/xml, */*',
      },
    });

    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') ?? 'text/plain';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).send('Proxy fetch failed');
  }
}
