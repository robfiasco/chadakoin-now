import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../lib/colors';

type Severity = 'green' | 'amber' | 'red' | 'blue';

interface StatusBadgeProps {
  label: string;
  severity?: Severity;
}

export function StatusBadge({ label, severity = 'green' }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, styles[severity]]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  green: { backgroundColor: Colors.green },
  amber: { backgroundColor: Colors.amber },
  red: { backgroundColor: Colors.red },
  blue: { backgroundColor: Colors.blueTeal },
});
