const LAT = 42.097;
const LON = -79.2353;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export interface WeatherData {
  temp: string;
  condition: string;
  high: string;
  low: string;
  precip: string;
  wind: string;
  icon: string;
}

let cache: { data: WeatherData; timestamp: number } | null = null;

function codeToCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Mostly Clear';
  if (code === 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95) return 'Storm';
  return 'Cloudy';
}

function codeToIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 85 && code <= 86) return '❄️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

export async function fetchWeather(): Promise<WeatherData> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,weathercode,windspeed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const json = await res.json();

  const temp = Math.round(json.current.temperature_2m);
  const code = json.current.weathercode;
  const wind = Math.round(json.current.windspeed_10m);
  const high = Math.round(json.daily.temperature_2m_max[0]);
  const low = Math.round(json.daily.temperature_2m_min[0]);
  const precip = json.daily.precipitation_probability_max[0] ?? 0;

  const data: WeatherData = {
    temp: `${temp}°`,
    condition: codeToCondition(code),
    high: `${high}°`,
    low: `${low}°`,
    precip: `${precip}%`,
    wind: `${wind} mph`,
    icon: codeToIcon(code),
  };

  cache = { data, timestamp: now };
  return data;
}
