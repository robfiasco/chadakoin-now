// Proxy for CDIR now-playing — avoids CORS from browser
export default async function handler(req, res) {
  try {
    const r = await fetch('https://radio.chadakoindigital.com/now.json');
    if (!r.ok) return res.status(502).json({ error: 'CDIR fetch failed' });
    const data = await r.json();
    // Resolve relative artwork URL
    if (data.artwork && !data.artwork.startsWith('http')) {
      data.artwork = `https://radio.chadakoindigital.com${data.artwork}`;
    }
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=10');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch {
    res.status(502).json({ error: 'CDIR fetch failed' });
  }
}
