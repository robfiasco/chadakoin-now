// Vercel serverless function — Eventbrite proxy
// Adds the auth token server-side so it never goes to the client.

export default async function handler(req, res) {
  // Accept either naming convention in Vercel dashboard
  const token = process.env.EXPO_PUBLIC_EVENTBRITE_TOKEN || process.env.EVENTBRITE_TOKEN;
  if (!token) return res.status(401).json({ error: 'Eventbrite token not configured' });

  const today = new Date().toISOString(); // full ISO with Z — more reliable
  const url =
    'https://www.eventbriteapi.com/v3/events/search/' +
    '?location.latitude=42.097' +      // coordinates more reliable than address
    '&location.longitude=-79.2353' +
    '&location.within=25mi' +           // widened — Jamestown is small
    '&expand=venue,category' +
    '&sort_by=date' +
    `&start_date.range_start=${encodeURIComponent(today)}`;

  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error('Eventbrite error', upstream.status, body);
      return res.status(upstream.status).json({ error: 'Eventbrite API error', detail: body });
    }

    const data = await upstream.json();
    console.log('Eventbrite returned', data.events?.length ?? 0, 'events');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1h cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Eventbrite fetch failed' });
  }
}
