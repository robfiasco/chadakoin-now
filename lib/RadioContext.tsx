import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
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

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Player lives here at the root level — survives tab navigation
  const radioPlayer = useAudioPlayer({ uri: 'https://radio.chadakoindigital.com/radio.mp3' });

  // Poll now-playing while radio is active
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

  async function toggleRadio() {
    if (radioLoading) return;
    if (radioPlaying) {
      radioPlayer.pause();
      setRadioPlaying(false);
    } else {
      setRadioLoading(true);
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        radioPlayer.play();
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
