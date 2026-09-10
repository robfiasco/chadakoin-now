import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiUrl } from './api';
import { isVersionBelow } from './version';

interface UpdateCheckState {
  required: boolean;
  storeUrl: string | null;
}

// Native only — web always serves the latest deployment, nothing to gate.
// Fails open: any error (network, malformed response, etc.) leaves the app
// usable rather than risking a bad deploy of this check locking everyone out.
export function useUpdateCheck(): UpdateCheckState {
  const [state, setState] = useState<UpdateCheckState>({ required: false, storeUrl: null });

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(apiUrl('/api/app-config'), { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const data = await res.json();
        const current = Constants.expoConfig?.version ?? '0.0.0';
        if (cancelled || !data?.minVersion) return;
        if (isVersionBelow(current, data.minVersion)) {
          const storeUrl = Platform.OS === 'ios' ? data.storeUrls?.ios : data.storeUrls?.android;
          setState({ required: true, storeUrl: storeUrl ?? null });
        }
      } catch {
        // fail open
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
