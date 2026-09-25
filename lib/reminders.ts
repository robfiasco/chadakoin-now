import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecyclingData, sideForDate, isWinterMonth } from '../hooks/useCivicData';

export const RECYCLING_PREF_KEY = 'notif_recycling_enabled';
export const PARKING_PREF_KEY = 'notif_parking_enabled';

// How far ahead to keep notifications scheduled. Both are well under iOS's
// 64-pending-notification cap even combined, and get topped back up to the
// full window every time the app opens (see syncAllReminders callers) —
// there's no background task here, so a rolling window refreshed on each
// foreground visit is what keeps these from ever running dry between opens.
const PARKING_WINDOW_DAYS = 14;

const RECYCLING_PREFIX = 'recycling-';
const PARKING_PREFIX = 'parking-';

const REMINDERS_CHANNEL = 'reminders';

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function getNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// Only call this from an explicit user action (e.g. flipping a Settings
// toggle) — never from a background sync, so the OS permission prompt is
// always tied to something the user just asked for.
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureAndroidChannel();
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getReminderPrefs() {
  const [recycling, parking] = await Promise.all([
    AsyncStorage.getItem(RECYCLING_PREF_KEY),
    AsyncStorage.getItem(PARKING_PREF_KEY),
  ]);
  return { recycling: recycling === '1', parking: parking === '1' };
}

export async function setReminderPref(key: typeof RECYCLING_PREF_KEY | typeof PARKING_PREF_KEY, enabled: boolean) {
  await AsyncStorage.setItem(key, enabled ? '1' : '0');
}

async function cancelByPrefix(prefix: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(n => n.identifier.startsWith(prefix))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

// Fires the morning a collection week starts. Re-run on every fresh
// recycling fetch (24h TTL) — cancels and rebuilds from scratch each time
// since the list is tiny (≤6 weeks) and this keeps corrected BPU data from
// ever leaving a stale reminder behind.
export async function syncRecyclingReminders(recycling: RecyclingData) {
  if (Platform.OS === 'web') return;
  const enabled = (await AsyncStorage.getItem(RECYCLING_PREF_KEY)) === '1';
  await cancelByPrefix(RECYCLING_PREFIX);
  if (!enabled) return;
  if (!(await getNotificationPermission())) return;

  const weeks = [recycling.thisWeek, recycling.nextWeek, ...recycling.upcomingWeeks];
  const now = new Date();

  for (const week of weeks) {
    if (!week.startDate || week.material === '—') continue;
    const fireDate = new Date(`${week.startDate}T08:00:00`);
    if (fireDate <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${RECYCLING_PREFIX}${week.startDate}`,
      content: {
        title: `${week.emoji} Recycling this week`,
        body: week.exclusions ? `${week.material} — no ${week.exclusions}` : week.material,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
    });
  }
}

// Daily "move your car" reminder, winter only (Nov–Mar), rolling window.
// Skips entirely outside winter — self-heals once Nov approaches, since
// this re-runs on every app open.
export async function syncParkingReminders() {
  if (Platform.OS === 'web') return;
  const enabled = (await AsyncStorage.getItem(PARKING_PREF_KEY)) === '1';
  await cancelByPrefix(PARKING_PREFIX);
  if (!enabled) return;
  if (!(await getNotificationPermission())) return;

  const now = new Date();
  for (let i = 0; i <= PARKING_WINDOW_DAYS; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() + i);
    if (!isWinterMonth(day)) continue;

    const fireDate = new Date(day);
    fireDate.setHours(8, 0, 0, 0);
    if (fireDate <= now) continue;
    const side = sideForDate(day);
    const iso = `${fireDate.getFullYear()}-${String(fireDate.getMonth() + 1).padStart(2, '0')}-${String(fireDate.getDate()).padStart(2, '0')}`;

    await Notifications.scheduleNotificationAsync({
      identifier: `${PARKING_PREFIX}${iso}`,
      content: {
        title: 'Move your car today',
        body: `${side === 'ODD' ? 'Odd' : 'Even'} side today — move by 10:00 AM.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
    });
  }
}
