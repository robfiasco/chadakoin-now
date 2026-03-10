# Changelog

All notable changes to Chadakoin Now are documented here.

---

## [1.0.0] — 2026-03-10

### First public-ready release

**Core screens**
- Home, Sports, News, Events, Settings — 5-tab navigation
- Settings accessible via gear icon in home header (not a tab)

**Themes**
- 5 themes: Chadakoin, Pearl City, Dahlstrom, Lucy, Crescent Tool
- Each named for a piece of Jamestown history with a description in Settings
- Theme dots on Home screen; full story in Settings

**Live data**
- Weather via OpenWeatherMap (5-min refresh, precip arrival time)
- Recycling schedule + exclusions via Jamestown BPU RSS
- Parking side computed from real date with winter countdown (Apr 1)
- Alerts from BPU + Chautauqua County RSS
- Events from Reg Lenna (Squarespace JSON), WRFA-LP, Prendergast Library, Jackson Center, JPS, Fenton History Center, RTPI (curated seeds)
- News from WRFA-LP 107.9 + City of Jamestown + Jackson Center RSS feeds

**Sports**
- Buffalo Sabres: record, last game, next game, top scorers — via NHL official API
- JCC Jayhawks: recent results with sport icons — via jccjayhawks.com RSS
- Tarp Skunks 2026 season ticket banner
- Collapsible team sections

**From Jamestown section**
- LOTD podcast (Live On Tape Delay) — latest episode via Libsyn RSS
- CDIR — in-app radio player with now-playing track + album art, polls every 30s

**Visitor mode**
- Toggle on Home screen (🧳 → 🏠)
- Shows local businesses by category (coffee, food, drinks, cannabis, activities, arts)
- Featured placement tier for businesses
- Weekend events (next 3 days)
- Recycling/parking hidden (not relevant for visitors)

**Local businesses (visitor mode)**
- Labyrinth Press Co., Crown Street Roasting Co. (coffee)
- Brazil Lounge, Wicked Warren's (drinks)
- Lifted Dispensary (cannabis)
- Honest John's Pizzeria, Pace's Pizzeria, A Slice of Home (food)
- National Comedy Center, Reg Lenna, RTPI, Fenton History Center, Chautauqua Institution, Chautauqua Lake (activities/arts)

**Jamestown history**
- "Did You Know?" fact of the day — 60 facts sourced from City of Jamestown Historical Marker Book (2022)
- Cycles deterministically by day of year — same fact for all users on the same day

**Infrastructure**
- Deployed to Vercel (chadakoin-now.vercel.app)
- Server-side API routes: `/api/weather`, `/api/sabres`, `/api/cdir`, `/api/proxy`
- Eventbrite token stubbed (API deprecated for public discovery)
- CORS proxy for RSS feeds

---

## [0.1.0] — 2026-03-09

### Initial scaffold

- App shell with Expo SDK 51 + expo-router
- Bottom tab navigation (5 tabs: Home, Recycling, Parking, Alerts, Events)
- All 5 screens implemented with mock data
- Design system established: color palette, card components, typography
- Reusable components: `Card`, `SectionHeader`, `StatusBadge`, `UpdatedLine`
- Mock data in `services/mockData.ts` covering all screens
- Documentation: PRD, design system, data sources, roadmap
- Git initialized, `.gitignore` and `.env.example` in place
