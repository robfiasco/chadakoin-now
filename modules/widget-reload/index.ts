import { Platform } from 'react-native';

let nativeModule: { reloadAllTimelines: () => void } | null = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireNativeModule } = require('expo-modules-core');
    nativeModule = requireNativeModule('WidgetReload');
  } catch {
    nativeModule = null;
  }
}

// Tells iOS to re-render the home screen widgets now, instead of waiting for
// their next scheduled refresh (which can be up to a day away) — needed
// because writing to SharedGroupPreferences alone doesn't wake WidgetKit.
export function reloadWidgetTimelines(): void {
  try {
    nativeModule?.reloadAllTimelines();
  } catch {}
}
