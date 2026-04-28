import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export interface SourceHealth {
  wrfaUp: boolean;
}

// Module-level cache — shared across all hook instances, survives re-renders
let _cache: { result: SourceHealth; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;
const STALE_THRESHOLD_MS = 36 * 60 * 60 * 1000; // 36 hours

function isFreshRss(text: string): boolean {
  const isRss = text.trimStart().startsWith('<?xml') || /<rss[\s>]/i.test(text.slice(0, 500));
  if (!isRss) return false;
  const pubMatch = text.match(/<pubDate>([^<]+)<\/pubDate>/);
  if (!pubMatch) return true; // can't tell — assume fresh
  const latest = new Date(pubMatch[1].trim());
  return Date.now() - latest.getTime() <= STALE_THRESHOLD_MS;
}

// Exported for use in async data-fetch functions (useCivicData)
export async function fetchSourceHealth(): Promise<SourceHealth> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.result;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);

    let wrfaUp = true;

    if (Platform.OS === 'web') {
      const r = await fetch('/api/source-health', { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) {
        wrfaUp = false;
      } else {
        const data = await r.json();
        wrfaUp = data.wrfa ?? true;
      }
    } else {
      // On native: check feed freshness AND homepage maintenance mode
      const [feedRes, homeRes] = await Promise.all([
        fetch('https://wrfalp.com/feed/', { signal: ctrl.signal }),
        fetch('https://wrfalp.com/', { signal: ctrl.signal }),
      ]);
      clearTimeout(t);
      if (!feedRes.ok) {
        wrfaUp = false;
      } else {
        const homeText = homeRes.ok ? await homeRes.text() : '';
        if (/maintenance mode/i.test(homeText)) {
          wrfaUp = false;
        } else {
          wrfaUp = isFreshRss(await feedRes.text());
        }
      }
    }

    _cache = { result: { wrfaUp }, ts: Date.now() };
    return _cache.result;
  } catch {
    return { wrfaUp: true }; // fail open
  }
}

export function useSourceHealth(): SourceHealth {
  const [health, setHealth] = useState<SourceHealth>({ wrfaUp: true });

  useEffect(() => {
    fetchSourceHealth().then(setHealth);
  }, []);

  return health;
}
