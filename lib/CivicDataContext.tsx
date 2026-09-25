import React, { createContext, useContext, useEffect } from 'react';
import { useCivicData, CivicData } from '../hooks/useCivicData';
import { syncRecyclingReminders, syncParkingReminders } from './reminders';

const CivicDataContext = createContext<CivicData | null>(null);

export function CivicDataProvider({ children }: { children: React.ReactNode }) {
  const data = useCivicData();

  // Opportunistic top-up: no background task, so the rolling reminder
  // window gets refilled every time fresh data lands (app open, pull to
  // refresh, 24h cache expiry). Both syncs are no-ops if their toggle is
  // off or the OS permission was never granted — see lib/reminders.ts.
  useEffect(() => {
    syncRecyclingReminders(data.recycling);
  }, [data.recycling]);

  useEffect(() => {
    syncParkingReminders();
  }, [data.parking]);

  return <CivicDataContext.Provider value={data}>{children}</CivicDataContext.Provider>;
}

// Drop-in replacement for useCivicData() in any screen
export function useCivic(): CivicData {
  const ctx = useContext(CivicDataContext);
  if (!ctx) throw new Error('useCivic must be used within CivicDataProvider');
  return ctx;
}
