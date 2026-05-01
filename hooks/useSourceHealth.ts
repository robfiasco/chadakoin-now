import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export interface SourceHealth {
  wrfaUp: boolean;
}

// Module-level cache — shared across all hook instances, survives re-renders
let _cache: { result: SourceHealth; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

// Exported for use in async data-fetch functions (useCivicData)
export async function fetchSourceHealth(): Promise<SourceHealth> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.result;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);

    let wrfaUp = true;

    const url = Platform.OS === 'web'
      ? '/api/source-health'
      : 'https://now.chadakoindigital.com/api/source-health';
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) {
      wrfaUp = false;
    } else {
      const data = await r.json();
      wrfaUp = data.wrfa ?? true;
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
