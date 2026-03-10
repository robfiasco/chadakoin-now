// Vercel serverless function — Eventbrite proxy
// Adds the auth token server-side so it never goes to the client.

export default async function handler(req, res) {
  const token = process.env.EXPO_PUBLIC_EVENTBRITE_TOKEN;
  if (!token) return res.status(401).json({ error: 'Eventbrite token not configured' });

  const today = new Date().toISOString().split('T')[0];
  const url =
    'https://www.eventbriteapi.com/v3/events/search/' +
    '?location.address=Jamestown%2C%20NY%2014701' +
    '&location.within=10mi' +
    '&expand=venue,category' +
    '&status=live' +
    '&sort_by=date' +
    `&start_date.range_start=${today}T00%3A00%3A00`;

  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Eventbrite API error' });
    }

    const data = await upstream.json();
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1h cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Eventbrite fetch failed' });
  }
}
