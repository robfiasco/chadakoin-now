import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

// Stylized, not geographic — a civic street grid with the Chadakoin River
// cutting through it. Faint by design: it should read as texture, not
// artwork. Shared by both day and night variants; only color/opacity shifts.

const W = 390;
const H = 844;

// Irregular spacing reads more like real city blocks than a perfect grid
const V_LINES = [18, 58, 71, 104, 146, 149, 191, 224, 267, 289, 312, 344, 372];
const H_LINES = [40, 92, 95, 138, 171, 214, 246, 289, 322, 364, 397, 429, 462, 505, 538, 571, 613, 646, 679, 721, 754, 787, 820];

const RIVER_D = `M 300 -10
  C 280 40, 320 90, 295 140
  C 270 190, 230 210, 245 260
  C 258 305, 300 330, 285 380
  C 270 428, 210 445, 200 495
  C 191 540, 220 570, 195 615
  C 172 656, 110 670, 95 715
  C 82 754, 100 790, 70 854`;

export function MapGridBackground({ night }: { night: boolean }) {
  const gridColor  = night ? 'rgba(180, 210, 235, 1)' : 'rgba(60, 50, 35, 1)';
  const gridOpacity = night ? 0.07 : 0.1;
  const riverColor = night ? 'rgba(90, 195, 230, 1)' : 'rgba(160, 130, 70, 1)';
  const riverOpacity = night ? 0.4 : 0.32;
  const labelColor = night ? 'rgba(160, 205, 230, 0.5)' : 'rgba(90, 75, 55, 0.55)';
  const riverLabelColor = night ? 'rgba(150, 210, 235, 0.55)' : 'rgba(150, 120, 65, 0.6)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        {V_LINES.map((x, i) => (
          <Line key={`v${i}`} x1={x} y1={0} x2={x} y2={H} stroke={gridColor} strokeWidth={1} opacity={gridOpacity} />
        ))}
        {H_LINES.map((y, i) => (
          <Line key={`h${i}`} x1={0} y1={y} x2={W} y2={y} stroke={gridColor} strokeWidth={1} opacity={gridOpacity} />
        ))}
        <Path d={RIVER_D} stroke={riverColor} strokeWidth={2.5} fill="none" opacity={riverOpacity} strokeLinecap="round" />
      </Svg>

      <Text style={[styles.label, styles.lakeLabel, { color: labelColor }]}>LAKE{'\n'}CHAUTAUQUA</Text>
      <Text style={[styles.label, styles.cityLabel, { color: labelColor }]}>JAMESTOWN</Text>
      <Text style={[styles.riverLabel, { color: riverLabelColor }]}>Chadakoin River</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  lakeLabel: { top: 78, left: 20, textAlign: 'left' },
  cityLabel: { top: 355, left: 20 },
  riverLabel: {
    position: 'absolute',
    top: 415,
    left: 232,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
});
