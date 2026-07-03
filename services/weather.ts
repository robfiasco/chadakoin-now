import { apiUrl } from '../lib/api';

export interface ForecastDay {
  date: string;
  high: number;
  low: number;
  precip: number;
  icon: string;
}

export interface HourlySlot {
  time: string;   // "2 PM"
  temp: number;
  icon: string;
  precip: number; // 0–100
}

export interface WeatherAlert {
  name: string;
  severity: 'extreme' | 'severe' | 'moderate' | 'minor';
  summary: string;
  expires: string | null;
}

export interface WeatherData {
  // Base
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
  // WeatherKit additions
  windDir?: string | null;
  windGust?: string | null;
  uvIndex?: number | null;
  uvLabel?: string | null;
  sunrise?: string | null;
  sunset?: string | null;
  hourly?: HourlySlot[];
  nextHour?: string | null;
  alerts?: WeatherAlert[];
}

const CACHE_TTL = 5 * 60 * 1000;
let cache: { data: WeatherData; timestamp: number } | null = null;

export async function fetchWeather(): Promise<WeatherData> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL) return cache.data;

  // All platforms go through the WeatherKit Vercel API
  const res = await fetch(apiUrl('/api/weather'));
  if (!res.ok) throw new Error('Weather API failed');
  const data: WeatherData = await res.json();

  cache = { data, timestamp: now };
  return data;
}
