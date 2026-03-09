# Data Sources — Chadakoin Now

This document tracks planned and implemented data sources for each screen.

Jamestown, NY coordinates: **42.0970° N, 79.2353° W**

---

## Weather

| Field        | Value |
|--------------|-------|
| Source       | National Weather Service (NWS) API |
| Official     | Yes (US Government) |
| Auth         | None required |
| Format       | JSON |
| Endpoint     | `https://api.weather.gov/points/42.0970,-79.2353` → then `/forecast` |
| Fields used  | temperature, shortForecast, detailedForecast, windSpeed, probabilityOfPrecipitation |
| Fallback     | Open-Meteo (`https://api.open-meteo.com/v1/forecast?latitude=42.0970&longitude=-79.2353`) |
| Notes        | NWS is free and reliable. Open-Meteo is the fallback, also no key required. Refresh every 5 minutes. |
| Status       | Mock data in place. Live adapter planned for Phase 2. |

---

## Recycling Schedule

| Field        | Value |
|--------------|-------|
| Source       | Jamestown Board of Public Utilities (BPU) |
| Official     | Yes |
| Format       | RSS or scraped HTML (TBD) |
| Endpoint     | `https://www.jamestownbpu.com` (RSS feed URL to be confirmed) |
| Fields used  | Pickup week type (A or B), date range, items in rotation, holiday delays |
| Fallback     | Hardcoded rotation schedule (Week A / Week B alternating, calculated from known start date) |
| Notes        | The BPU site may not have a clean RSS feed. Fallback calculation from a known reference date is reliable. |
| Status       | Mock data in place. Rotation logic + BPU feed adapter planned for Phase 2. |

---

## Alternate-Side Parking

| Field        | Value |
|--------------|-------|
| Source       | Algorithmic (city rule: park on odd side on odd dates, even side on even dates) |
| Official     | Rule sourced from City of Jamestown ordinance |
| Format       | No API — calculated in-app |
| Endpoint     | N/A |
| Fields used  | Current date, day of month (odd/even) |
| Fallback     | Display "Check city website" if date parsing fails |
| Notes        | Winter rules (Nov–Apr) and snow emergencies override the base rule. Overrides require a manual flag or alert from the city. |
| Status       | Logic can be implemented without any API. Phase 2 will add snow emergency override via alerts feed. |

---

## City Alerts

| Field        | Value |
|--------------|-------|
| Source       | Jamestown BPU and/or City of Jamestown |
| Official     | Yes |
| Format       | RSS feed (TBD) |
| Endpoint     | `https://www.jamestownbpu.com/rss` (to be confirmed) |
| Fields used  | Alert title, body, severity, date |
| Fallback     | Static "No active alerts" state |
| Notes        | May need to scrape the BPU news/alerts page if no RSS is available. Severity must be inferred from keywords (e.g., "snow emergency" → red, "delay" → amber). |
| Status       | Mock data in place. Feed adapter planned for Phase 2. |

---

## Events

| Field        | Value |
|--------------|-------|
| Source       | City of Jamestown official calendar |
| Official     | Yes |
| Format       | iCal or scraped HTML (TBD) |
| Endpoint     | `https://www.jamestownny.gov/calendar` (iCal export URL to be confirmed) |
| Fields used  | Event title, date, time, location, category/tags |
| Fallback     | Static list updated manually per release |
| Notes        | If the city provides an iCal feed, parsing is straightforward. If not, manual curation is acceptable for MVP. |
| Status       | Mock data in place. Live feed adapter planned for Phase 2. |
