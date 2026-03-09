import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../lib/colors';

export function UpdatedLine({ text }: { text: string }) {
  return <Text style={styles.text}>{text}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    color: Colors.gray400,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});
