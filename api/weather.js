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
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=imperial&appid=${key}`),
    ]);

    if (!currentRes.ok) throw new Error('OWM current fetch failed');

    const current = await currentRes.json();
    const forecastJson = forecastRes.ok ? await forecastRes.json() : null;

    const temp    = Math.round(current.main.temp);
    const feels   = Math.round(current.main.feels_like);
    const humidity = current.main.humidity;
    const windMph = Math.round(current.wind.speed);
    const condition = current.weather[0].main;
    const description = current.weather[0].description
      .split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    const icon = codeToIcon(current.weather[0].id, current.weather[0].icon);

    const periods = forecastJson?.list ?? [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPeriods = periods.filter(f => f.dt_txt.startsWith(todayStr));
    // Fall back to next 8 periods when today's data is sparse (e.g. late-night call)
    const hlPeriods = todayPeriods.length ? todayPeriods : periods.slice(0, 8);
    const next24 = periods.slice(0, 8);
    const high = hlPeriods.length
      ? Math.round(Math.max(...hlPeriods.map(f => f.main.temp_max)))
      : Math.round(current.main.temp_max ?? temp);
    const low = hlPeriods.length
      ? Math.round(Math.min(...hlPeriods.map(f => f.main.temp_min)))
      : Math.round(current.main.temp_min ?? temp);
    const precip = next24.length
      ? Math.round(Math.max(...next24.map(f => (f.pop ?? 0) * 100)))
      : 0;

    const dailyMap = {};
    for (const p of periods) {
      const date = p.dt_txt.split(' ')[0]; // "2026-03-11"
      if (!dailyMap[date]) {
        dailyMap[date] = { temps: [], pops: [], codes: [], icons: [] };
      }
      dailyMap[date].temps.push(p.main.temp_max, p.main.temp_min);
      dailyMap[date].pops.push(p.pop ?? 0);
      dailyMap[date].codes.push(p.weather[0].id);
      dailyMap[date].icons.push(p.weather[0].icon);
    }

    const today = new Date().toISOString().split('T')[0];
    const forecast = Object.entries(dailyMap)
      .filter(([date]) => date >= today)
      .slice(0, 5)
      .map(([date, d]) => {
        const dayIcon = d.icons.find(i => i.endsWith('d')) ?? d.icons[0];
        const dominantCode = d.codes.length
          ? d.codes.reduce((a, b) =>
              d.codes.filter(c => c === a).length >= d.codes.filter(c => c === b).length ? a : b
            )
          : 800;
        return {
          date,
          high: Math.round(Math.max(...d.temps)),
          low:  Math.round(Math.min(...d.temps)),
          precip: Math.round(Math.max(...d.pops) * 100),
          icon: codeToIcon(dominantCode),
        };
      });

    let precipAt = null;
    const currentWeatherId = current.weather[0].id;
    const isRainingNow = currentWeatherId >= 200 && currentWeatherId < 700;

    if (!isRainingNow && periods.length) {
      const firstWetPeriod = periods.find(f => (f.pop ?? 0) >= 0.4);
      if (firstWetPeriod) {
        const dt = new Date(firstWetPeriod.dt * 1000);
        const hour = dt.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h = hour % 12 || 12;
        precipAt = `${h} ${ampm}`;
      }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      temp: `${temp}°`,
      feelsLike: `${feels}°`,
      condition: description,
      high: `${high}°`,
      low: `${low}°`,
      precip: `${precip}%`,
      precipAt,
      forecast,
      wind: `${windMph} mph`,
      humidity: `${humidity}%`,
      icon,
    });
  } catch (err) {
    res.status(502).json({ error: 'Weather fetch failed' });
  }
}
