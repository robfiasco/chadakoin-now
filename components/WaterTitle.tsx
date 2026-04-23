import { Text, StyleSheet } from 'react-native';

// Native fallback — plain styled text
export function WaterTitle() {
  return (
    <Text style={styles.appName} numberOfLines={1}>
      Chadakoin Now
    </Text>
  );
}

const styles = StyleSheet.create({
  appName: { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
});
