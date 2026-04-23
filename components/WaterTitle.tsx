import { Text, StyleSheet } from 'react-native';

export function WaterTitle() {
  return (
    <Text style={styles.root} numberOfLines={1}>
      Chadakoin{' '}
      <Text style={styles.accent}>Now</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  root:   { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  accent: { color: '#22d3ee' },
});
