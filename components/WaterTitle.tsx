import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/ThemeContext';

export function WaterTitle() {
  const { theme } = useTheme();
  return (
    <Text style={styles.root} numberOfLines={1}>
      Chadakoin{' '}
      <Text style={[styles.accent, { color: theme.acc }]}>Now</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  root:   { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  accent: { color: '#22d3ee' }, // fallback; overridden at render time by theme.acc
});
