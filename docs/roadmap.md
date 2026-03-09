# Roadmap — Chadakoin Now

---

## Phase 0 — Setup

- [x] Expo project initialized
- [x] TypeScript configured
- [x] expo-router installed
- [x] Color palette defined
- [x] Component library scaffolded (Card, SectionHeader, StatusBadge, UpdatedLine)
- [x] Git initialized

---

## Phase 1 — Mock MVP

**Target: v0.1.0 — Complete**

- [x] Home screen with summary dashboard
- [x] Recycling screen with pickup schedule
- [x] Parking screen with alternate-side logic (mock)
- [x] Alerts screen with status + update feed
- [x] Events screen with month tabs
- [x] All screens use mock data from `services/mockData.ts`
- [x] Bottom tab navigation working
- [x] Design system documented

---

## Phase 2 — Live Data Adapters

**Target: v0.2.0**

- [ ] NWS weather API integration (no key required)
- [ ] BPU recycling schedule — RSS feed or rotation calculator
- [ ] Parking logic — algorithmic odd/even from system date
- [ ] Alerts feed — BPU RSS or scraper
- [ ] Events feed — city calendar iCal or manual list
- [ ] In-memory caching with TTL (weather: 5 min, recycling: 24 hr)
- [ ] Error states for failed fetches

---

## Phase 3 — Polish

**Target: v0.3.0**

- [ ] Loading skeletons / shimmer placeholders
- [ ] Empty states for each screen
- [ ] Pull-to-refresh on all screens
- [ ] Async Storage caching (persist last-known data offline)
- [ ] Accessibility: font scaling, contrast checks, screen reader labels
- [ ] Android adaptive icon finalized
- [ ] Splash screen with deepBlue background

---

## Future Considerations

These are not committed — just tracking for future discussion:

- **iOS release** — Expo build for App Store
- **Web version** — expo-router web target for browser access
- **Push notifications** — Snow emergency alerts, recycling day reminders
- **Snow emergency mode** — Full-screen override UI when a snow emergency is declared
- **Address-specific pickup** — BPU has zone-based schedules; could personalize by address
- **Offline-first** — Cache all data on last successful fetch, show "last updated" prominently
