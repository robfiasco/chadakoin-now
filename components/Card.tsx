import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../lib/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'primary' | 'dark';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.card, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  default: {
    backgroundColor: Colors.warmWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  primary: {
    backgroundColor: Colors.deepBlue,
  },
  dark: {
    backgroundColor: Colors.charcoal,
  },
});
