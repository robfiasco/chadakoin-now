import { Platform } from 'react-native';

const LAT = 42.097;
const LON = -79.2353;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes — ~288 OWM calls/day, well within 2000 free limit

export interface ForecastDay {
  date: string;    // YYYY-MM-DD
  high: number;
  low: number;
  precip: number;  // percentage 0–100
  icon: string;
}

export interface WeatherData {
  temp: string;
  feelsLike?: string;
  condition: string;
  high: string;
  low: string;
  precip: string;
  precipAt?: string | null;
  wind: string;
  humidity?: string;
  icon: string;
  forecast?: ForecastDay[];
}

let cache: { data: WeatherData; timestamp: number } | null = null;

function omCodeToCondition(code: number): string {
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

function omCodeToIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 85 && code <= 86) return '❄️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

async function fetchFromOpenMeteo(): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,weathercode,windspeed_10m` +
    `&hourly=precipitation_probability` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York` +
    `&forecast_days=2`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Open-Meteo fetch failed');
  const json = await res.json();

  // Find the next hour with >= 40% precip probability
  const nowIso = new Date().toISOString();
  const hourlyTimes: string[] = json.hourly?.time ?? [];
  const hourlyProbs: number[] = json.hourly?.precipitation_probability ?? [];
  let precipAt: string | null = null;
  for (let i = 0; i < hourlyTimes.length; i++) {
    if (hourlyTimes[i] > nowIso && hourlyProbs[i] >= 40) {
      const dt = new Date(hourlyTimes[i]);
      const h = dt.getHours() % 12 || 12;
      precipAt = `${h} ${dt.getHours() >= 12 ? 'PM' : 'AM'}`;
      break;
    }
  }

  return {
    temp: `${Math.round(json.current.temperature_2m)}°`,
    condition: omCodeToCondition(json.current.weathercode),
    high: `${Math.round(json.daily.temperature_2m_max[0])}°`,
    low: `${Math.round(json.daily.temperature_2m_min[0])}°`,
    precip: `${json.daily.precipitation_probability_max[0] ?? 0}%`,
    precipAt,
    wind: `${Math.round(json.current.windspeed_10m)} mph`,
    icon: omCodeToIcon(json.current.weathercode),
  };
}

export async function fetchWeather(): Promise<WeatherData> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL) return cache.data;

  let data: WeatherData;

  if (Platform.OS === 'web') {
    // On web: use our Vercel API route (OpenWeatherMap, key server-side)
    const res = await fetch('/api/weather');
    if (!res.ok) throw new Error('Weather API failed');
    data = await res.json();
  } else {
    // On native: use Open-Meteo (no key needed)
    data = await fetchFromOpenMeteo();
  }

  cache = { data, timestamp: now };
  return data;
}
