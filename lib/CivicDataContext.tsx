import React, { createContext, useContext } from 'react';
import { useCivicData, CivicData } from '../hooks/useCivicData';

const CivicDataContext = createContext<CivicData | null>(null);

export function CivicDataProvider({ children }: { children: React.ReactNode }) {
  const data = useCivicData();
  return <CivicDataContext.Provider value={data}>{children}</CivicDataContext.Provider>;
}

// Drop-in replacement for useCivicData() in any screen
export function useCivic(): CivicData {
  const ctx = useContext(CivicDataContext);
  if (!ctx) throw new Error('useCivic must be used within CivicDataProvider');
  return ctx;
}
