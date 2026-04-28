// Weekly gas prices from EIA (Energy Information Administration).
// Fetches both the Central Atlantic regional average (closest to western NY)
// and the US national average — displayed side by side for context.
// Set EIA_API_KEY in Vercel env vars — free key at eia.gov/opendata

const SERIES_REGIONAL  = 'EMM_EPM0_PTE_R1Y_DPG'; // Central Atlantic (NY/NJ/PA/MD)
const SERIES_NATIONAL  = 'EMM_EPM0_PTE_NUS_DPG';  // US National average
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h — EIA updates weekly

let cached = null; // { regional, national, period, fetchedAt }

async function fetchSeries(apiKey, seriesId) {
  const url = new URL('https://api.eia.gov/v2/petroleum/pri/gnd/data/');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('frequency', 'weekly');
  url.searchParams.append('data[]', 'value');
  url.searchParams.append('facets[series][]', seriesId);
  url.searchParams.append('sort[0][column]', 'period');
  url.searchParams.append('sort[0][direction]', 'desc');
  url.searchParams.set('length', '1');
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`EIA ${r.status}`);
  const json = await r.json();
  return json?.response?.data?.[0];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return res.status(200).json(cached);
  }

  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ regional: null, national: null, period: null });
  }

  try {
    const [regRow, natRow] = await Promise.all([
      fetchSeries(apiKey, SERIES_REGIONAL),
      fetchSeries(apiKey, SERIES_NATIONAL),
    ]);

    if (!regRow || !natRow) throw new Error('Missing data');

    const regional = parseFloat(regRow.value);
    const national = parseFloat(natRow.value);
    const diff = regional - national;

    cached = {
      regional: `$${regional.toFixed(2)}`,
      national: `$${national.toFixed(2)}`,
      diff: parseFloat(diff.toFixed(2)),   // positive = region more expensive
      period: regRow.period,               // e.g. "2025-04-28"
      fetchedAt: Date.now(),
    };
    return res.status(200).json(cached);
  } catch (err) {
    console.error('Gas price fetch error:', err);
    return res.status(200).json({ regional: null, national: null, period: null, error: 'Unavailable' });
  }
}
