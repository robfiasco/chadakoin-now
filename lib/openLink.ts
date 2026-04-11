import { Linking } from 'react-native';

// Only opens http/https — rejects javascript:, tel:, data:, etc.
// Use for all URLs from external sources (RSS, APIs).
export function openLink(url: string | undefined | null): void {
  if (!url) return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return;
    Linking.openURL(url);
  } catch {
    // Malformed URL — silently ignore
  }
}
