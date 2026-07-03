// WeatherKit REST API — Apple Weather (500k calls/month included with Apple Developer account).
// Attribution required in UI: "Weather data provided by Apple Weather™"
//
// Datasets: currentWeather, forecastHourly, forecastDaily, weatherAlerts, forecastNextHour
// Returns the same base shape as the old OWM endpoint plus new fields.

import { sign } from 'crypto';

const LAT        = 42.097;
const LON        = -79.2353;
const TIMEZONE   = 'America/New_York';
const TEAM_ID    = '3UM77ULJKQ';
const KEY_ID     = 'FC9FH9P8FQ';
const SERVICE_ID = 'com.chadakoinnow.weatherkit';

// Cache the signed JWT for 25 min (token expires in 30 min)
let _jwt = null;
let _jwtExp = 0;

function getJWT() {
  const now = Math.floor(Date.now() / 1000);
  if (_jwt && now < _jwtExp - 300) return _jwt;

  const b64 = process.env.WEATHERKIT_PRIVATE_KEY;
  if (!b64) throw new Error('WEATHERKIT_PRIVATE_KEY not set');
  const pem = Buffer.from(b64, 'base64').toString('utf8');

  const header = Buffer.from(JSON.stringify({
    alg: 'ES256', kid: KEY_ID, id: `${TEAM_ID}.${SERVICE_ID}`,
  })).toString('base64url');

  const exp = now + 30 * 60;
  const payload = Buffer.from(JSON.stringify({
    iss: TEAM_ID, iat: now, exp, sub: SERVICE_ID,
  })).toString('base64url');

  const signingInput = `${header}.${payload}`;
  const sig = sign(null, Buffer.from(signingInput), {
    key: pem, dsaEncoding: 'ieee-p1363',
  }).toString('base64url');

  _jwt = `${signingInput}.${sig}`;
  _jwtExp = exp;
  return _jwt;
}

// WeatherKit conditionCode → emoji
const ICONS = {
  Clear:                 { d: '☀️', n: '🌙' },
  MostlyClear:          { d: '🌤️', n: '🌙' },
  PartlyCloudy:         { d: '⛅',  n: '☁️' },
  MostlyCloudy:         { d: '🌥️', n: '☁️' },
  Cloudy:               { d: '☁️', n: '☁️' },
  Drizzle:              { d: '🌦️', n: '🌦️' },
  DrizzleLight:         { d: '🌦️', n: '🌦️' },
  DrizzleModerate:      { d: '🌦️', n: '🌦️' },
  DrizzleHeavy:         { d: '🌧️', n: '🌧️' },
  RainWithSunshine:     { d: '🌦️', n: '🌦️' },
  Rain:                 { d: '🌧️', n: '🌧️' },
  HeavyRain:            { d: '🌧️', n: '🌧️' },
  IsolatedThunderstorms:{ d: '⛈️', n: '⛈️' },
  Thunderstorms:        { d: '⛈️', n: '⛈️' },
  SevereThunderstorm:   { d: '⛈️', n: '⛈️' },
  HailAndThunderstorms: { d: '⛈️', n: '⛈️' },
  Snow:                 { d: '❄️', n: '❄️' },
  Flurries:             { d: '🌨️', n: '🌨️' },
  HeavySnow:            { d: '❄️', n: '❄️' },
  Blizzard:             { d: '❄️', n: '❄️' },
  Sleet:                { d: '🌨️', n: '🌨️' },
  FreezingDrizzle:      { d: '🌨️', n: '🌨️' },
  FreezingRain:         { d: '🌨️', n: '🌨️' },
  Hail:                 { d: '🌧️', n: '🌧️' },
  // Fog emoji missing from many Android Noto fonts; use cloud
  Fog:                  { d: '☁️', n: '☁️' },
  Haze:                 { d: '☁️', n: '☁️' },
  Smoky:                { d: '☁️', n: '☁️' },
  Dust:                 { d: '☁️', n: '☁️' },
  Breezy:               { d: '🌤️', n: '🌙' },
  Windy:                { d: '💨', n: '💨' },
  TropicalStorm:        { d: '🌀', n: '🌀' },
  Hurricane:            { d: '🌀', n: '🌀' },
  Tornado:              { d: '🌀', n: '🌀' },
};

function conditionIcon(code, day = true) {
  const e = ICONS[code];
  if (!e) return day ? '🌤️' : '🌙';
  return day ? e.d : e.n;
}

function conditionLabel(code) {
  return code.replace(/([A-Z])/g, ' $1').trim();
}

const toF = c => Math.round(c * 9 / 5 + 32);

function degToCompass(deg) {
  if (deg == null) return null;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function uvLabel(uv) {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

function formatLocalTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Build a human-readable "Rain in ~X min" / "Rain ending ~X min" string
// from the forecastNextHour summary segments.
function nextHourSummary(nextHourData, isWetNow) {
  const summary = nextHourData?.summary;
  if (!summary?.length) return null;
  const now = Date.now();

  if (isWetNow) {
    const clearSeg = summary.find(s => s.condition === 'clear' && new Date(s.startTime) > now);
    if (clearSeg) {
      const mins = Math.round((new Date(clearSeg.startTime) - now) / 60_000);
      if (mins > 0 && mins <= 60) return `Rain ending ~${mins} min`;
    }
  } else {
    const wetSeg = summary.find(s => s.condition === 'precipitation' && new Date(s.startTime) > now);
    if (wetSeg) {
      const mins = Math.round((new Date(wetSeg.startTime) - now) / 60_000);
      if (mins > 0 && mins <= 60) return `Rain in ~${mins} min`;
    }
  }
  return null;
}

export default async function handler(req, res) {
  try {
    const jwt = getJWT();

    const url = `https://weatherkit.apple.com/api/v1/weather/en/${LAT}/${LON}`
      + `?dataSets=currentWeather,forecastHourly,forecastDaily,weatherAlerts,forecastNextHour`
      + `&timezone=${TIMEZONE}`
      + `&countryCode=US`;

    const wkRes = await fetch(url, {
      headers: { Authorization: `Bearer ${jwt}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!wkRes.ok) {
      const body = await wkRes.text();
      throw new Error(`WeatherKit ${wkRes.status}: ${body.slice(0, 200)}`);
    }

    const wk     = await wkRes.json();
    const cur    = wk.currentWeather;
    const daily  = wk.forecastDaily?.days  ?? [];
    const hours  = wk.forecastHourly?.hours ?? [];

    // ── Current ──────────────────────────────────────────────────
    const isDay    = cur.daylight ?? true;
    const temp     = toF(cur.temperature);
    const feels    = toF(cur.temperatureApparent);
    const humidity = Math.round((cur.humidity ?? 0) * 100);
    const windMph  = Math.round((cur.windSpeed ?? 0) * 0.621371);
    const gustMph  = cur.windGust != null ? Math.round(cur.windGust * 0.621371) : null;
    const windDir  = degToCompass(cur.windDirection);
    const icon     = conditionIcon(cur.conditionCode, isDay);
    const condition = conditionLabel(cur.conditionCode);
    const uvIndex  = cur.uvIndex ?? null;
    const isWetNow = (cur.precipitationIntensity ?? 0) > 0;

    // ── Today's forecast ─────────────────────────────────────────
    const todayForecast = daily[0];
    const high   = todayForecast ? toF(todayForecast.temperatureMax) : temp;
    const low    = todayForecast ? toF(todayForecast.temperatureMin) : temp;
    const precip = todayForecast ? Math.round((todayForecast.precipitationChance ?? 0) * 100) : 0;
    const sunrise = todayForecast ? formatLocalTime(todayForecast.sunrise) : null;
    const sunset  = todayForecast ? formatLocalTime(todayForecast.sunset)  : null;

    // ── 5-day forecast ────────────────────────────────────────────
    const todayStr = new Date().toISOString().split('T')[0];
    const forecast = daily.slice(0, 5).map(d => ({
      date:   d.forecastStart.split('T')[0],
      high:   toF(d.temperatureMax),
      low:    toF(d.temperatureMin),
      precip: Math.round((d.precipitationChance ?? 0) * 100),
      icon:   conditionIcon(d.conditionCode, true),
    }));

    // ── Hourly strip (next 10 hours) ──────────────────────────────
    const nowMs = Date.now();
    const hourly = hours
      .filter(h => new Date(h.forecastStart).getTime() > nowMs)
      .slice(0, 10)
      .map(h => {
        const dt  = new Date(h.forecastStart);
        const hr  = dt.getHours();
        const ampm = hr >= 12 ? 'PM' : 'AM';
        return {
          time:  `${hr % 12 || 12} ${ampm}`,
          temp:  toF(h.temperature),
          icon:  conditionIcon(h.conditionCode, h.daylight ?? (hr >= 6 && hr < 20)),
          precip: Math.round((h.precipitationChance ?? 0) * 100),
        };
      });

    // ── precipAt (hourly fallback) ────────────────────────────────
    let precipAt = null;
    if (!isWetNow) {
      const nextWet = hours.find(h =>
        new Date(h.forecastStart).getTime() > nowMs &&
        (h.precipitationChance ?? 0) >= 0.4
      );
      if (nextWet) {
        const dt    = new Date(nextWet.forecastStart);
        const hr    = dt.getHours();
        const dayStr = nextWet.forecastStart.split('T')[0];
        precipAt = `${dayStr > todayStr ? 'Tmrw ' : ''}${hr % 12 || 12} ${hr >= 12 ? 'PM' : 'AM'}`;
      }
    }

    // ── Next-hour precision ───────────────────────────────────────
    const nextHour = nextHourSummary(wk.forecastNextHour, isWetNow);

    // ── Weather alerts ────────────────────────────────────────────
    const now = new Date();
    const alerts = (wk.weatherAlerts?.alerts ?? [])
      .filter(a => !a.expireTime || new Date(a.expireTime) > now)
      .map(a => ({
        name:     a.name,
        severity: a.severity ?? 'moderate',
        summary:  (a.summary ?? a.description ?? '').slice(0, 300),
        expires:  a.expireTime ? formatLocalTime(a.expireTime) : null,
      }));

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      // Base fields (same as before)
      temp:      `${temp}°`,
      feelsLike: `${feels}°`,
      condition,
      high:      `${high}°`,
      low:       `${low}°`,
      precip:    `${precip}%`,
      precipAt,
      forecast,
      wind:      `${windMph} mph`,
      humidity:  `${humidity}%`,
      icon,
      // New fields
      windDir,
      windGust:  gustMph != null ? `${gustMph} mph` : null,
      uvIndex,
      uvLabel:   uvIndex != null ? uvLabel(uvIndex) : null,
      sunrise,
      sunset,
      hourly,
      nextHour,
      alerts,
    });
  } catch (err) {
    console.error('WeatherKit error:', err.message);
    res.status(502).json({ error: 'Weather fetch failed' });
  }
}
