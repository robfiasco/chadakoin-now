// Local CORS proxy — runs server-side, forwards RSS/JSON requests
// that would otherwise be blocked by browser CORS policy.
// Only used on web; native fetches directly.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');

  if (!target) {
    return new Response('Missing url param', { status: 400 });
  }

  try {
    const upstream = await fetch(decodeURIComponent(target), {
      headers: {
        'User-Agent': 'ChadakoinNow/1.0',
        'Accept': 'application/rss+xml, application/xml, application/json, text/xml, */*',
      },
    });

    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') ?? 'text/plain';

    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 5 min browser cache
      },
    });
  } catch (err) {
    return new Response('Proxy fetch failed', { status: 502 });
  }
}
