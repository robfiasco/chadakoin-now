# Design System — Chadakoin Now

---

## Colors

| Token       | Hex       | Usage                                      |
|-------------|-----------|---------------------------------------------|
| `green`     | `#2FBF71` | Positive states, active tab, success badges |
| `greenBright` | `#49D17D` | Hover/pressed states, accents              |
| `deepBlue`  | `#163A59` | Headers, tab bar, primary card backgrounds  |
| `blueTeal`  | `#1F5673` | Secondary structure, info badges, icons     |
| `cream`     | `#F4EFE6` | Screen backgrounds                          |
| `warmWhite` | `#FBF8F2` | Card surfaces, default card background      |
| `charcoal`  | `#14212B` | Primary body text                           |
| `amber`     | `#F59E0B` | Caution states, weather notes, warnings     |
| `red`       | `#EF4444` | True urgency only — emergency alerts        |
| `gray400`   | `#9CA3AF` | Secondary text, inactive tab icons          |
| `gray600`   | `#4B5563` | Supporting detail text                      |

**Rules:**
- Red is reserved for genuine emergencies. Never use for decoration.
- Amber is for caution, not failure.
- Green is for all-clear, active, and positive states.
- Blue tones are structural — navigation, headers, informational content.

---

## Spacing

Base unit: **4px**

| Size | Value | Usage                    |
|------|-------|--------------------------|
| xs   | 4px   | Icon gaps, tight padding |
| sm   | 8px   | Row padding, small gaps  |
| md   | 12–16px | Card padding, section gaps |
| lg   | 20–24px | Screen horizontal padding |
| xl   | 32px  | Vertical breathing room  |

---

## Typography

System fonts only (no custom font loading in MVP).

| Role           | Size | Weight | Notes                        |
|----------------|------|--------|-------------------------------|
| App name       | 26   | 800    | Home screen header            |
| Screen title   | 24   | 800    | Per-screen headers            |
| Section header | 13   | 700    | Uppercase, tracked, gray400   |
| Card heading   | 15–18 | 700  | Varies by context             |
| Body text      | 13–14 | 400  | Standard content              |
| Detail/meta    | 11–12 | 400–600 | Timestamps, labels          |
| Big number     | 40–48 | 300–900 | Parking side, weather temp  |

---

## Cards

Three variants defined in `components/Card.tsx`:

- **default** — warmWhite background, subtle shadow, elevation 2
- **primary** — deepBlue background, no shadow (used for hero cards)
- **dark** — charcoal background (used for high-urgency alert states)

Card rules:
- Always 16px border radius
- Always 16px padding
- 12px bottom margin by default
- Never put text directly on cream background — use a card

---

## Navigation

- Tab bar background: `#163A59` (deepBlue)
- Active tab icon + label: `#2FBF71` (green)
- Inactive tab icon + label: `#9CA3AF` (gray400)
- Tab bar height: 64px
- No top border on tab bar
- Label font size: 11, weight 600

---

## Icons

- Library: `@expo/vector-icons` — Ionicons only
- No emoji-style icons anywhere in the app
- Sizing: 18px for inline row icons, 20px for card icons, 32px for status indicators

Icon assignments:
| Feature    | Icon                      |
|------------|---------------------------|
| Home       | `home-outline`            |
| Recycling  | `refresh-outline`         |
| Parking    | `car-outline`             |
| Alerts     | `warning-outline`         |
| Events     | `calendar-outline`        |
| Holiday    | `calendar-outline`        |
| Weather note | `alert-circle-outline`  |
| All clear  | `checkmark-circle`        |
| Info       | `information-circle-outline` |
| Location   | `location-outline`        |
| Snow/Winter | `snow-outline`           |
| Time       | `time-outline`            |

---

## Status Badges

Defined in `components/StatusBadge.tsx`. Four severity levels:

| Severity | Background | Usage                      |
|----------|------------|----------------------------|
| green    | `#2FBF71`  | All clear, no issues       |
| amber    | `#F59E0B`  | Caution, winter rules, etc |
| red      | `#EF4444`  | Emergency only             |
| blue     | `#1F5673`  | Informational              |
