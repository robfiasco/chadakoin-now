import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

// Stylized, not geographic — a faint civic street grid with the Chadakoin
// River as the one bright element cutting through it. Water reads as water
// in both variants; only the UI accent (title, checkmarks) swaps warm/cool
// with day/night.

const W = 390;
const H = 844;

// Irregular spacing reads more like real city blocks than a perfect grid
const V_LINES = [18, 71, 149, 224, 289, 344];
const H_LINES = [40, 95, 171, 246, 322, 397, 462, 538, 613, 679, 754, 820];

const RIVER_D = `M 300 -10
  C 280 40, 320 90, 295 140
  C 270 190, 230 210, 245 260
  C 258 305, 300 330, 285 380
  C 270 428, 210 445, 200 495
  C 191 540, 220 570, 195 615
  C 172 656, 110 670, 95 715
  C 82 754, 100 790, 70 854`;

export function MapGridBackground({ night }: { night: boolean }) {
  const gridColor  = night ? 'rgba(180, 210, 235, 1)' : 'rgba(200, 215, 235, 1)';
  const gridOpacity = 0.05;
  const riverCore  = '#8fd8f5';
  const riverGlow  = '#4fa8d8';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        {V_LINES.map((x, i) => (
          <Line key={`v${i}`} x1={x} y1={0} x2={x} y2={H} stroke={gridColor} strokeWidth={1} opacity={gridOpacity} />
        ))}
        {H_LINES.map((y, i) => (
          <Line key={`h${i}`} x1={0} y1={y} x2={W} y2={y} stroke={gridColor} strokeWidth={1} opacity={gridOpacity} />
        ))}
        {/* Poor-man's glow: stacked strokes, wide+faint under narrow+bright */}
        <Path d={RIVER_D} stroke={riverGlow}  strokeWidth={22} opacity={0.18} fill="none" strokeLinecap="round" />
        <Path d={RIVER_D} stroke={riverGlow}  strokeWidth={12} opacity={0.3}  fill="none" strokeLinecap="round" />
        <Path d={RIVER_D} stroke={riverCore}  strokeWidth={4}  opacity={0.85} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
