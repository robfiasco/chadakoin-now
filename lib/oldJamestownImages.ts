import { Platform, ImageSourcePropType } from 'react-native';

// React Native's bundler needs static require() calls — can't require() a
// variable path — so every image gets an explicit entry here, same pattern
// as the tspark.jpg/hockey.jpg background images in app/sports.tsx. Native
// bundles these from assets/old-jamestown/; web serves the same files from
// public/old-jamestown/ (both populated from old-jamestown/images/ and
// old-jamestown/headers/ at authoring time — keep them in sync if an image
// is ever swapped).
const NATIVE_CLIPPINGS: Record<string, ImageSourcePropType> = Platform.OS === 'web' ? {} : {
  '1902-halloween-pranks.jpg':      require('../assets/old-jamestown/1902-halloween-pranks.jpg'),
  '1900-halloween-pranks.jpg':      require('../assets/old-jamestown/1900-halloween-pranks.jpg'),
  '1896-falconer-mischief.jpg':     require('../assets/old-jamestown/1896-falconer-mischief.jpg'),
  '1891-disgraceful-observance.jpg': require('../assets/old-jamestown/1891-disgraceful-observance.jpg'),
};

// Sepia, headline-only 1200×630 hero images — used on the Home card and at
// the top of the detail screen. The full clipping (above) is secondary now,
// reachable further down the detail screen as "See the original page."
const NATIVE_HEADERS: Record<string, ImageSourcePropType> = Platform.OS === 'web' ? {} : {
  '1902-halloween-pranks.jpg':      require('../assets/old-jamestown/headers/1902-halloween-pranks.jpg'),
  '1900-halloween-pranks.jpg':      require('../assets/old-jamestown/headers/1900-halloween-pranks.jpg'),
  '1896-falconer-mischief.jpg':     require('../assets/old-jamestown/headers/1896-falconer-mischief.jpg'),
  '1891-disgraceful-observance.jpg': require('../assets/old-jamestown/headers/1891-disgraceful-observance.jpg'),
};

export function oldJamestownImageSource(filename: string): ImageSourcePropType {
  return Platform.OS === 'web'
    ? { uri: `/old-jamestown/${filename}` }
    : NATIVE_CLIPPINGS[filename];
}

export function oldJamestownHeaderSource(filename: string): ImageSourcePropType {
  return Platform.OS === 'web'
    ? { uri: `/old-jamestown/headers/${filename}` }
    : NATIVE_HEADERS[filename];
}
