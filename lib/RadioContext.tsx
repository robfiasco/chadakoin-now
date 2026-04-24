import React, { createContext, useContext, useState } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as WebBrowser from 'expo-web-browser';

interface RadioContextValue {
  radioPlaying: boolean;
  radioLoading: boolean;
  toggleRadio: () => Promise<void>;
}

const RadioContext = createContext<RadioContextValue>({
  radioPlaying: false,
  radioLoading: false,
  toggleRadio: async () => {},
});

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);

  // Player lives here at the root level — survives tab navigation
  const radioPlayer = useAudioPlayer({ uri: 'https://radio.chadakoindigital.com/radio.mp3' });

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
    <RadioContext.Provider value={{ radioPlaying, radioLoading, toggleRadio }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  return useContext(RadioContext);
}
