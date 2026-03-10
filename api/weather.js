// Vercel serverless function — OpenWeatherMap proxy
// API key stays server-side, returns normalized weather data.

const LAT = 42.097;
const LON = -79.2353;

function codeToIcon(id, icon) {
  if (icon?.endsWith('n')) {
    if (id === 800) return '🌙';
    if (id >= 801) return '☁️';
  }
  if (id === 800) return '☀️';
  if (id >= 801 && id <= 804) return id === 801 ? '⛅' : '☁️';
  if (id >= 200 && id < 300) return '⛈️';
  if (id >= 300 && id < 400) return '🌦️';
  if (id >= 500 && id < 600) return id >= 511 ? '🌨️' : '🌧️';
  if (id >= 600 && id < 700) return '❄️';
  if (id >= 700 && id < 800) return '🌫️';
  return '🌤️';
}

export default async function handler(req, res) {
  const key = process.env.OPEN_WEATHER;
  if (!key) return res.status(401).json({ error: 'API key not configured' });

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=imperial&appid=${key}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=imperial&cnt=8&appid=${key}`),
    ]);

    if (!currentRes.ok) throw new Error('OWM current fetch failed');

    const current = await currentRes.json();
    const forecast = forecastRes.ok ? await forecastRes.json() : null;

    const temp    = Math.round(current.main.temp);
    const feels   = Math.round(current.main.feels_like);
    const humidity = current.main.humidity;
    const windMph = Math.round(current.wind.speed);
    const condition = current.weather[0].main;
    const description = current.weather[0].description
      .split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    const icon = codeToIcon(current.weather[0].id, current.weather[0].icon);

    // High/low + precip from 24h forecast
    const periods = forecast?.list ?? [];
    const high = periods.length
      ? Math.round(Math.max(...periods.map(f => f.main.temp_max)))
      : Math.round(current.main.temp_max ?? temp);
    const low = periods.length
      ? Math.round(Math.min(...periods.map(f => f.main.temp_min)))
      : Math.round(current.main.temp_min ?? temp);
    const precip = periods.length
      ? Math.round(Math.max(...periods.map(f => (f.pop ?? 0) * 100)))
      : 0;

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60'); // 5 min edge cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      temp: `${temp}°`,
      feelsLike: `${feels}°`,
      condition: description,
      high: `${high}°`,
      low: `${low}°`,
      precip: `${precip}%`,
      wind: `${windMph} mph`,
      humidity: `${humidity}%`,
      icon,
    });
  } catch (err) {
    res.status(502).json({ error: 'Weather fetch failed' });
  }
}
