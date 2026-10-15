// Jamestown BPU holiday collection delays.
//
// BPU rule: when an observed holiday falls on a weekday, there is no pickup
// that day and every collection day from the holiday through Friday slides
// one day later — Thursday's route runs Friday, Friday's runs Saturday.
// Days BEFORE the holiday are unaffected.
//
// Source: BPU 2026 recycling calendar (CALENDAR_URL below). Only the six
// dates the calendar actually marks as delay days are listed. Columbus /
// Indigenous Peoples' Day, Veterans Day, MLK Day and Presidents Day are NOT
// delay days — collection runs normally — so they are deliberately absent.
//
// To roll this forward a year: replace the array with next year's dates from
// the new calendar PDF and update CALENDAR_URL. Nothing else needs touching.

export interface BpuHoliday {
  date: string; // 'YYYY-MM-DD', the observed holiday
  name: string;
}

export const BPU_HOLIDAYS: BpuHoliday[] = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-07-04', name: 'Independence Day' },
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-11-26', name: 'Thanksgiving' },
  { date: '2026-12-25', name: 'Christmas' },
];

export const CALENDAR_URL = 'https://www.jamestownnybpu.gov/DocumentCenter/View/1085/2026-English-Recycling-Calendar-PDF';
export const BPU_HOTLINE = '716-661-1651';

export interface HolidayNotice {
  holidayName: string;
  /** e.g. "No pickup Thu Nov 26. Thursday moves to Friday, Friday moves to Saturday." */
  text: string;
  badgeLabel: 'HOLIDAY WEEK';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Parse 'YYYY-MM-DD' as a LOCAL calendar date. `new Date('2026-11-26')`
// parses as UTC midnight, which is the previous evening in Eastern time and
// would shift every weekday calculation here by one day.
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Local calendar date as 'YYYY-MM-DD' — same helper used by the civic cards. */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * The holiday notice for the week containing `today`, or null.
 *
 * Runs Sunday-before through the following Saturday. Returns null for a
 * Saturday or Sunday holiday: the delay rule only pushes weekday routes, so
 * a weekend holiday (2026's Jul 4) shifts nothing and a notice would just be
 * noise.
 */
export function getHolidayNotice(today: Date = new Date()): HolidayNotice | null {
  const todayKey = localDateKey(today);

  for (const h of BPU_HOLIDAYS) {
    const holiday = parseLocalDate(h.date);
    const dow = holiday.getDay(); // 0 Sun … 6 Sat
    if (dow === 0 || dow === 6) continue; // no weekday routes to shift

    // Sunday before the holiday → Saturday after it (the BPU "week").
    const weekStart = new Date(holiday);
    weekStart.setDate(holiday.getDate() - dow);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    if (todayKey < localDateKey(weekStart) || todayKey > localDateKey(weekEnd)) continue;

    // Every route from the holiday through Friday slides one day later.
    const shifts: string[] = [];
    for (let d = dow; d <= 5; d++) {
      shifts.push(`${DAY_NAMES[d]} moves to ${DAY_NAMES[d + 1]}`);
    }

    const stamp = `${DAY_ABBR[dow]} ${MONTH_ABBR[holiday.getMonth()]} ${holiday.getDate()}`;
    return {
      holidayName: h.name,
      text: `No pickup ${stamp}. ${shifts.join(', ')}.`,
      badgeLabel: 'HOLIDAY WEEK',
    };
  }

  return null;
}
