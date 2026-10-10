import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { OLD_JAMESTOWN_STORIES, OldJamestownStory } from '../data/oldJamestown';

// Detail screen needs to open from two places (the Home card and the News
// archive list) without duplicating its state in both tabs — same reason
// RadioContext exists for the CDIR player. Rendered once at the AppLayout
// tier in app/_layout.tsx, same as the onboarding/update-required overlays.
interface OldJamestownContextValue {
  releasedStories: OldJamestownStory[]; // newest publishDate first
  latestStory: OldJamestownStory | null;
  selectedStory: OldJamestownStory | null;
  openStory: (slug: string) => void;
  closeStory: () => void;
}

const OldJamestownContext = createContext<OldJamestownContextValue>({
  releasedStories: [],
  latestStory: null,
  selectedStory: null,
  openStory: () => {},
  closeStory: () => {},
});

export function useOldJamestown() {
  return useContext(OldJamestownContext);
}

// Local-date (not UTC) comparison, same reasoning as localDateKey in
// city-services.tsx and app/index.tsx — a date-only string parses as UTC
// midnight via the Date constructor, hours before actual local midnight.
function localDateKey(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function OldJamestownProvider({ children }: { children: React.ReactNode }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const releasedStories = useMemo(() => {
    const todayKey = localDateKey(new Date());
    return OLD_JAMESTOWN_STORIES
      .filter(s => s.publishDate <= todayKey)
      .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  }, []);

  const latestStory = releasedStories[0] ?? null;

  const selectedStory = useMemo(
    () => releasedStories.find(s => s.slug === selectedSlug) ?? null,
    [releasedStories, selectedSlug]
  );

  // Web-only deep link: a shared /?story=<slug> URL opens straight to that
  // story on load — the "web version" the Share button links to, without
  // needing real per-story routes (this app has none; every screen is a
  // flat component shown via state, not expo-router navigation).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const slug = new URLSearchParams(window.location.search).get('story');
    if (slug) setSelectedSlug(slug);
  }, []);

  return (
    <OldJamestownContext.Provider
      value={{
        releasedStories,
        latestStory,
        selectedStory,
        openStory: setSelectedSlug,
        closeStory: () => setSelectedSlug(null),
      }}
    >
      {children}
    </OldJamestownContext.Provider>
  );
}
