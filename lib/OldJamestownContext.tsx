import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OLD_JAMESTOWN_STORIES, OldJamestownStory } from '../data/oldJamestown';
import { apiUrl } from './api';

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

const CACHE_KEY = 'archives_stories_v1';

export function OldJamestownProvider({ children }: { children: React.ReactNode }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  // Starts with the bundled already-released snapshot so there's never an
  // empty Home card on a cold start; replaced by the server's list (or the
  // last cached one) as soon as either resolves.
  const [stories, setStories] = useState<OldJamestownStory[]>(OLD_JAMESTOWN_STORIES);

  useEffect(() => {
    let cancelled = false;

    // Cached copy first so an offline launch still shows the most recent
    // list this device saw, rather than falling all the way back to
    // whatever happened to be bundled at build time.
    AsyncStorage.getItem(CACHE_KEY)
      .then(raw => {
        if (cancelled || !raw) return;
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) setStories(cached);
      })
      .catch(() => {});

    fetch(apiUrl('/api/archives'))
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (cancelled || !json) return;
        const fresh = json.stories;
        // An empty array is a legitimate server answer only if nothing has
        // released yet; treating it as authoritative would blank a card
        // that's currently showing a real story, so keep what we have.
        if (!Array.isArray(fresh) || fresh.length === 0) return;
        setStories(fresh);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  // The server already filtered by Eastern date and sorted newest-first;
  // the bundled fallback is released-only by construction. No client-side
  // date filtering — that was the old bug, where a device with a wrong
  // clock could surface a story early.
  const releasedStories = stories;
  const latestStory = releasedStories[0] ?? null;

  const selectedStory = useMemo(
    () => releasedStories.find(s => s.slug === selectedSlug) ?? null,
    [releasedStories, selectedSlug]
  );

  // Web-only deep link: a shared /?story=<slug> URL opens straight to that
  // story on load — the "web version" the Share button links to, without
  // needing real per-story routes (this app has none; every screen is a
  // flat component shown via state, not expo-router navigation). A slug
  // that isn't in the released list simply resolves to null, so a guessed
  // ?story=<future slug> shows nothing.
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
