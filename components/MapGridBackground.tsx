import React from 'react';
import { StyleSheet, View, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Real Jamestown street map (dark-styled), Chadakoin River included —
// swapped in for the hand-drawn SVG version. Same image for both day and
// night variants; a gradient scrim keeps foreground text readable over the
// map detail without hiding the river.

const MAP_SOURCE = Platform.OS === 'web'
  ? { uri: '/jamestown-map.jpg' }
  : require('../assets/jamestown-map.jpg');

export function MapGridBackground({ night }: { night: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={MAP_SOURCE} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(6,14,24,0.55)', 'rgba(6,14,24,0.7)', 'rgba(6,14,24,0.55)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
