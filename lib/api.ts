import { Platform } from 'react-native';

const API_BASE = Platform.OS === 'web' ? '' : 'https://now.chadakoindigital.com';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
