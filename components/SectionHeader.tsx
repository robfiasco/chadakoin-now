import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../lib/colors';

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.header}>{title}</Text>;
}

const styles = StyleSheet.create({
  header: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray400,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
});
