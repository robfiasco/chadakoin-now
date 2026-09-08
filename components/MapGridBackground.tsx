import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Just the Chadakoin River as a glowing ribbon running the full height of
// the screen — no street grid (read as a literal map, not the intent).
// Water stays blue-cyan in both variants; only the UI accent (title,
// checkmarks) swaps warm/cool with day/night.
//
// preserveAspectRatio="none" (stretch-to-fill, not slice/crop) so the path
// reliably spans the full container regardless of device aspect ratio —
// with "slice" a container taller/shorter than the viewBox crops the top
// or bottom, which was cutting the river off before it reached the
// checklist rows lower on screen.

const RIVER_D = `M 62 0
  C 40 60, 78 110, 55 165
  C 32 218, -8 240, 12 295
  C 30 345, 78 375, 60 430
  C 42 480, -18 500, 0 555
  C 16 605, 62 630, 45 685
  C 28 733, -22 750, -5 800
  C 10 845, 55 870, 38 920
  C 22 962, -15 980, 0 1000`;

export function MapGridBackground({ night }: { night: boolean }) {
  const riverCore = '#8fd8f5';
  const riverGlow = '#4fa8d8';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 1000" preserveAspectRatio="none">
        {/* Poor-man's glow: stacked strokes, wide+faint under narrow+bright */}
        <Path d={RIVER_D} stroke={riverGlow} strokeWidth={11} opacity={0.2}  fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <Path d={RIVER_D} stroke={riverGlow} strokeWidth={6}  opacity={0.32} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <Path d={RIVER_D} stroke={riverCore} strokeWidth={2}  opacity={0.85} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </Svg>
    </View>
  );
}
