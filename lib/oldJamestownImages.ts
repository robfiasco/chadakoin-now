import { Platform, ImageSourcePropType } from 'react-native';

const SITE_ORIGIN = 'https://now.chadakoindigital.com';

// React Native's bundler needs static require() calls — can't require() a
// variable path — so each bundled fallback image gets an explicit entry,
// same pattern as the tspark.jpg/hockey.jpg backgrounds in app/sports.tsx.
// Only already-released stories are bundled (see data/oldJamestown.ts), so
// this map is small by design; anything newer arrives from /api/archives
// with an absolute URL and loads over the network instead.
const NATIVE_HEADERS: Record<string, ImageSourcePropType> = Platform.OS === 'web' ? {} : {
  '1902-halloween-pranks.jpg': require('../assets/old-jamestown/headers/1902-halloween-pranks.jpg'),
};

// Accepts either an absolute URL (what /api/archives returns) or a bare
// filename (what a bundled fallback story stores). A relative path would
// resolve against the app bundle on iOS rather than the site, so the native
// branch always ends up at either a bundled asset or an absolute URL.
export function oldJamestownHeaderSource(headerImage: string): ImageSourcePropType {
  if (/^https?:\/\//i.test(headerImage)) return { uri: headerImage };
  if (Platform.OS === 'web') return { uri: `/old-jamestown/headers/${headerImage}` };
  return NATIVE_HEADERS[headerImage] ?? { uri: `${SITE_ORIGIN}/old-jamestown/headers/${headerImage}` };
}
