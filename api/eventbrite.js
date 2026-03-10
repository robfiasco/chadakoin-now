// Vercel serverless function — Eventbrite proxy
// Adds the auth token server-side so it never goes to the client.

export default async function handler(req, res) {
  // Accept either naming convention in Vercel dashboard
  const token = process.env.EXPO_PUBLIC_EVENTBRITE_TOKEN || process.env.EVENTBRITE_TOKEN;
  if (!token) return res.status(401).json({ error: 'Eventbrite token not configured' });

  // First verify the token is valid
  const meRes = await fetch(`https://www.eventbriteapi.com/v3/users/me/?token=${token}`);
  const meBody = await meRes.json();
  console.log('Eventbrite token check:', meRes.status, JSON.stringify(meBody).slice(0, 100));

  if (!meRes.ok) {
    return res.status(401).json({ error: 'Eventbrite token invalid', detail: meBody });
  }

  const today = new Date().toISOString().split('T')[0];
  const url =
    'https://www.eventbriteapi.com/v3/events/search' +
    `?token=${token}` +
    '&location.latitude=42.097' +
    '&location.longitude=-79.2353' +
    '&location.within=25mi' +
    '&expand=venue,category' +
    '&sort_by=date' +
    `&start_date.range_start=${today}T00%3A00%3A00`;

  console.log('Fetching Eventbrite search...');

  try {
    const upstream = await fetch(url);

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
