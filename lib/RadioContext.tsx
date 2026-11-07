import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import * as WebBrowser from 'expo-web-browser';

export interface NowPlaying {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
}

interface RadioContextValue {
  radioPlaying: boolean;
  radioLoading: boolean;
  nowPlaying: NowPlaying | null;
  toggleRadio: () => Promise<void>;
}

const RadioContext = createContext<RadioContextValue>({
  radioPlaying: false,
  radioLoading: false,
  nowPlaying: null,
  toggleRadio: async () => {},
});

async function fetchNowPlaying(): Promise<NowPlaying | null> {
  try {
    const url = Platform.OS === 'web'
      ? '/api/cdir'
      : 'https://radio.chadakoindigital.com/now.json';
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title:  data.title  ?? '',
      artist: data.artist ?? '',
      album:  data.album  ?? '',
      artwork: data.artwork?.startsWith('http')
        ? data.artwork
        : data.artwork
          ? `https://radio.chadakoindigital.com${data.artwork}`
          : undefined,
    };
  } catch { return null; }
}

function lockScreenMetadata(np: NowPlaying | null) {
  return {
    title: np?.title || 'CDIR',
    artist: np?.artist || 'Chadakoin Digital Radio',
    albumTitle: np?.album || undefined,
    artworkUrl: np?.artwork,
  };
}

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Player lives here at the root level — survives tab navigation
  const radioPlayer = useAudioPlayer({ uri: 'https://radio.chadakoindigital.com/radio.mp3' });

  // Fetch artwork on mount so it shows before the user hits play
  useEffect(() => {
    fetchNowPlaying().then(setNowPlaying).catch(() => {});
  }, []);

  useEffect(() => {
    if (radioPlaying) {
      fetchNowPlaying().then(setNowPlaying).catch(() => {});
      pollRef.current = setInterval(() => {
        fetchNowPlaying().then(setNowPlaying).catch(() => {});
      }, 15_000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [radioPlaying]);

  // Lock screen / Control Center "now playing" card (native only — web
  // leaves this to the browser). Re-sent whenever the polled track changes.
  useEffect(() => {
    if (Platform.OS === 'web' || !radioPlaying) return;
    radioPlayer.updateLockScreenMetadata(lockScreenMetadata(nowPlaying));
  }, [nowPlaying, radioPlaying]);

  // Keep the in-app button honest when playback changes outside the app:
  // pause/play from the lock screen, or a phone call interrupting the
  // stream. Only treat "not playing" as a stop once the stream had actually
  // started — right after play() it's briefly not-playing while buffering.
  const status = useAudioPlayerStatus(radioPlayer);
  const startedRef = useRef(false);
  useEffect(() => {
    if (status.playing) {
      startedRef.current = true;
      if (!radioPlaying) setRadioPlaying(true);
    } else if (radioPlaying && startedRef.current && !status.isBuffering) {
      startedRef.current = false;
      setRadioPlaying(false);
    }
  }, [status.playing, status.isBuffering]);

  async function toggleRadio() {
    if (radioLoading) return;
    if (radioPlaying) {
      startedRef.current = false;
      radioPlayer.pause();
      setRadioPlaying(false);
    } else {
      setRadioLoading(true);
      try {
        // shouldPlayInBackground keeps the stream going when the app is
        // minimized or the phone locks (pairs with UIBackgroundModes: audio
        // in app.json — iOS needs both).
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
        radioPlayer.play();
        if (Platform.OS !== 'web') {
          radioPlayer.setActiveForLockScreen(true, lockScreenMetadata(nowPlaying));
        }
        setRadioPlaying(true);
      } catch {
        setRadioPlaying(false);
        WebBrowser.openBrowserAsync('https://radio.chadakoindigital.com').catch(() => {});
      } finally {
        setRadioLoading(false);
      }
    }
  }

  return (
    <RadioContext.Provider value={{ radioPlaying, radioLoading, nowPlaying, toggleRadio }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  return useContext(RadioContext);
}
