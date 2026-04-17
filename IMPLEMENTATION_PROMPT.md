# Chadakoin Now — App Redesign Implementation

This is a complete redesign brief for the Chadakoin Now app. All seven pages have been re-thought with a consistent design system and a clear monetization strategy. The JSX mockups in `/mockups` are reference implementations — single-file React components showing exact layouts, spacing, and interactions. Use them as the source of truth.

**Project:** Chadakoin Now (Expo/React Native for mobile, Next.js for the web landing page)
**Stack:** Next.js, TypeScript, Tailwind, lucide-react
**Goal:** Ship a cohesive v2 with a clear Featured tier monetization path

---

## Design System (global — apply everywhere)

**Background:** `#060e18`
**Surface:** `bg-slate-900/40` with `border border-slate-800/80` and `rounded-2xl`
**Page titles:** `text-[28-34px] font-bold tracking-tight`
**Section labels:** `text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold`
**Body:** `text-slate-200` / muted `text-slate-400` / subtle `text-slate-500`

**Category color map (must be consistent across News, Events, Visit, City Services):**
- `cyan-400` — City / Parking / Primary CTA / Featured
- `emerald-400` — Community / Recycling / Open Now / Family / Shop
- `rose-400` — Music / Live / Breaking
- `amber-400` — Film / Eat / State / Coming Up
- `violet-400` — Arts / See / JCC
- `blue-400` — Stay
- `teal-400` — Do / Activity

**Component patterns:**
- Status pills with pulsing dot for "live/active" states: `animate-pulse` on a 1.5px colored dot
- Left-edge 4px color bar on list cards (category indicator)
- Sticky section headers on long scroll lists (sports week, events by day, visit by category)
- Bottom nav: Home / Sports / News / Events / Visit (5 tabs, cyan-400 active with `bg-cyan-400/10` tile)

---

## Page-by-page changes

### 1. Home (`/mockups/home-redesign.jsx`)

**Remove:** Theme picker from top (moved to Settings). "Big" podcast card format.

**Rebuild around a hierarchy of urgency:**
1. Header with date chip + settings gear (theme picker is NOT on home anymore)
2. Weather card (condensed — `H 67° · L 52° · Rain 20%` inline, not 4 detail pills) + 5-day forecast row
3. "Today in Jamestown" — 2-col grid: Recycling card + Parking card (replaces the full-width Paper card)
4. "Top Story" teaser — hero card with gradient + icon watermark, "All news →" link
5. "This Weekend" teaser — single event card, "All events →" link
6. "From Jamestown" — CDIR (live) + LOTD (latest episode), compact horizontal cards with play buttons
7. "Did You Know?" — compressed single card, not hero-sized
8. Footer: `Updated 9:16 PM`

**Paper recycling detail (Accepted / Not Accepted lists)** moves to a tap-through detail screen. Don't show on home.

---

### 2. News (`/mockups/news-redesign.jsx`)

**Remove:** Body preview on every card (creates the "wall of text"). Redundant WRFA-LP pills. Absolute dates on every card.

**Rebuild:**
- Hero card for top story with category color-coded gradient, icon watermark, "Top Story" pulsing badge
- Compact list cards below: headline + one meta row (`Source · Time · Category`) with color-coded category
- Time-based sections: `Just In` / `Earlier Today` / `This Week` with thin gradient dividers
- Relative time (`2h ago`, not `Apr 16`)
- Filter chips (All / WRFA / City / State / JCC) — active state is solid cyan

---

### 3. Events (`/mockups/events-redesign.jsx`)

**Remove:** Random colored left bars (no meaning). Date block on every single card. Month-only filter chips.

**Rebuild:**
- Featured event hero with `FEATURED THIS WEEKEND` label, gradient + icon, date/time as glass pills
- Day-grouped sections with sticky headers: `WED · Apr 22`, `SAT · Apr 25` (positon:sticky)
- Compact cards under each day header: time + title + venue + category label
- Left-edge color bar now semantic (music=rose, film=amber, arts=violet, community/family=emerald)
- Filter chips lead with `This Weekend` / `This Week` (how people actually think) then months

---

### 4. Visit (`/mockups/visit-redesign.jsx`)

**Biggest structural change of any page.**

**Remove:** "Your business, right here" hero CTA (moves to web landing page). Weekly hours walls. Ambiguous "VISITED" pill.

**Rebuild:**
- Search bar at top (full-width pill, live filter across name/address/tags)
- Filter chips with category icons (All / Eat / Stay / Do / See / Shop)
- List/Map view toggle (list default; map view is a future ticket — uses Mapbox or Google Maps)
- **Editor's Picks section** — 2 max, hero treatment with category pill, Open/Closed status, review quote, website + directions actions
- **Browse by category** — grouped sections with sticky headers showing count (`Eat · 6 places`)
- Compact list cards: name + `Been there` badge (cyan pill, inline with name, only for places Rob has personally visited) + address + Open/Closed status with colored dot
- "Open · Closes 9PM" replaces weekly hours wall (show today's status; tap to expand for full week)
- Footer CTA: Feature your business → `chadakoindigital.com/featured` (subtle, gradient card)

**Three-tier hierarchy:**
- **Editor's Pick** = Rob has been there + actively recommends it (hero treatment)
- **Been there** = Rob has personally visited (small cyan badge, NOT a tracker — editorial signal)
- **No badge** = listed but not yet personally vetted

---

### 5. Settings (`/mockups/settings-redesign.jsx`)

**Biggest architectural change:** City Services is REMOVED from Settings and becomes its own screen.

**Rebuild as real settings:**
- Your Zone row (drives personalized trash/parking/flushing alerts)
- Notifications section — 6 toggles, each with subtitle explaining *when* it fires: Parking, Recycling, Breaking News, Weekend Events, LOTD episodes, CDIR live shows
- Appearance section — Theme picker (grid of 8 color dots + names, checkmark on active)
- About section — What's new, Send feedback, Privacy, Terms
- Feature your business row (subtle secondary surface, shows `chadakoindigital.com/featured` URL explicitly)
- Footer: version + "Built by Chadakoin Digital in Jamestown, NY"

---

### 6. City Services (NEW page — `/mockups/city-services-redesign.jsx`)

**New standalone screen.** Reached from Home's "Today in Jamestown" section via a "More services →" link (add this link to Home).

**Content:** Yard Waste Site, Water Main Flushing, Bulk Trash & Electronics, Leaf Collection, Sharps/Syringe Disposal, Snow & Ice Removal. Scaffolding should be extensible — more services will be added.

**Pattern:**
- Filter chips: All / Active Now / Coming Up / Year Round
- Status pills with pulse for "Active Now" items
- Expandable cards (collapsed by default — first active item expanded on load)
- Expanded state uses a key/value grid: `LOCATION | 1001 Monroe St`, `SATURDAYS | Open now · 7am–1pm`
- Callout info boxes for tips (`Info` icon + colored background)
- Footer attribution: `Pulled from jamestownny.gov & jamestownbpu.com · Last refreshed ...`

---

### 7. Sports (`/mockups/sports-redesign.jsx`)

Reference mockup exists in outputs — if it doesn't match the design system, bring it into alignment with the same patterns used in News/Events/Visit (category colors, compact cards, sticky section headers, consistent typography).

---

## Web landing page (NEW — `/mockups/featured-landing.jsx`)

Not part of the app. Lives at `chadakoindigital.com/featured`. This is the monetization landing page.

**Structure:**
1. Hero — split layout, headline + CTA on left, live preview of Featured card on right
2. How it works — 3 steps: Apply → Visit → Launch (two weeks)
3. What's included — 4 feature cards: Editor's note, Featured badge + placement, Priority coverage across app, Monthly stats
4. **The honest part** — integrity section explaining Editor's Pick (free, editorial, never for sale) vs Featured (paid, clearly marked, capped at 5). **Explicitly states no paid Featured partners currently exist.**
5. Pricing — Listed (free) vs Featured ($199/mo, intro $99/mo for first 5 as Launch Offer)
6. FAQ — 6 questions covering real objections
7. Application form — 6 fields, "Have I been there yet?" as a warm/cold lead indicator
8. Footer with `rob@chadakoindigital.com`

**Business rules that must be preserved in copy:**
- No photo responsibilities (photos are optional, sent by business if they have one; default is the app's native icon+gradient card)
- Deliverable is an "editor's note" (few sentences), NOT a "review"
- Editor's Picks are editorial and free — never monetized
- Featured placement is clearly labeled as such in-app
- Zero retroactive Featured badges — existing hero cards stay as Editor's Picks
- 5 slots max at any time (scarcity is part of the value)

**Form backend:** Route submissions to `rob@chadakoindigital.com` via Resend or similar. Consider n8n workflow: form → Notion database → email notification → Stripe Payment Link once approved.

---

## Cross-cutting work

1. **Add a `visited: boolean` field** to every place in the Visit dataset (editorial signal, not user tracking). Only flip when Rob has actually been there.
2. **Add a `featured: boolean` field** to places for the paid tier (default false; flip when a partner's subscription is active).
3. **Deep link handling:** app's `chadakoindigital.com/featured` CTAs should use `Linking.openURL()` (React Native) to open in Safari/Chrome, not an in-app webview.
4. **Notification scheduler** — Settings toggles need to actually wire up. Use Expo Notifications with local scheduling for parking/recycling (date-based), and a backend push trigger for LOTD/CDIR/News (event-based).
5. **User Zone → personalized content** — selecting a zone should filter Water Main Flushing details, show correct trash day, and default parking side.
6. **Source attribution** on City Services — display last refresh timestamp; implement a nightly scrape or manual content update flow.

---

## Implementation order (recommended)

1. **Home + City Services first** — this pair is the architectural shift (pulling civic content out of Settings). Ship them together so "Today in Jamestown" + "More services →" flows correctly.
2. **Settings rebuild** — now that it's slim, finish the notification toggles and theme picker.
3. **Visit refactor** — bring in search, grouped categories, `Been there` badge, three-tier hierarchy.
4. **News + Events** — apply the hero-card + compact-list pattern and category color system.
5. **Sports alignment** — bring into the shared design system.
6. **Featured landing page on chadakoindigital.com** — deploy on Vercel, wire up form to email/Notion/Stripe.
7. **In-app CTAs** — link to the landing page from Visit footer + Settings.

---

## Files in `/mockups`

| File | Purpose |
|---|---|
| `home-redesign.jsx` | Home page |
| `news-redesign.jsx` | News page |
| `events-redesign.jsx` | Events page |
| `visit-redesign.jsx` | Visit Jamestown (directory) |
| `sports-redesign.jsx` | Sports page |
| `settings-redesign.jsx` | Slimmed Settings |
| `city-services-redesign.jsx` | NEW City Services standalone page |
| `featured-landing.jsx` | chadakoindigital.com/featured landing page |

Each file is a single React component with Tailwind classes. Import patterns and state management match the app's existing conventions. Adapt prop/data structure to whatever the Chadakoin Now codebase currently uses — the mockups use hardcoded sample data for demo purposes.
