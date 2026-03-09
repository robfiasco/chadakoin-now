# Chadakoin Now

A free resident utility app for Jamestown, NY. Built to answer the questions locals ask every week — without digging through city websites, social media, or calling 311.

## Why it exists

Jamestown residents have no single place to check:
- Is my garbage delayed this week?
- What side of the street do I park on today?
- Is there a snow emergency active?
- What's getting recycled this week?
- What city events are coming up?

Chadakoin Now answers all of that in one glance.

---

## Stack

- **React Native + Expo** (SDK 51)
- **TypeScript**
- **expo-router** for file-based navigation
- **No UI library** — custom components with `StyleSheet`
- **Bottom tab navigation** — 5 tabs: Home, Recycling, Parking, Alerts, Events

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

Requires Expo Go on your device or a running Android/iOS emulator.

---

## Project Structure

```
chadakoin-now/
├── app/
│   ├── _layout.tsx         # Root layout — tab navigator
│   ├── index.tsx           # Home screen
│   ├── recycling.tsx       # Recycling screen
│   ├── parking.tsx         # Parking screen
│   ├── alerts.tsx          # Alerts screen
│   └── events.tsx          # Events screen
├── components/
│   ├── Card.tsx            # Base card component
│   ├── SectionHeader.tsx   # Uppercase section label
│   ├── StatusBadge.tsx     # Colored status pill
│   └── UpdatedLine.tsx     # "Updated today · 6:00 AM" line
├── lib/
│   └── colors.ts           # Color palette constants
├── services/
│   └── mockData.ts         # All mock data for MVP
├── assets/                 # App icons and images
└── docs/                   # PRD, design system, roadmap
```

---

## Version

**0.1.0** — Initial scaffold with mock data. All 5 screens functional. No live API calls yet.

See [CHANGELOG.md](./CHANGELOG.md) and [docs/roadmap.md](./docs/roadmap.md) for what's next.

---

## Data Sources (Planned)

- **Weather**: National Weather Service API (no key required)
- **Recycling / Alerts**: Jamestown BPU RSS feeds
- **Parking**: Algorithmic (odd/even date logic) + manual overrides
- **Events**: Jamestown city calendar

See [docs/data-sources.md](./docs/data-sources.md) for full detail.
