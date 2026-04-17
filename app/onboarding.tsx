import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  Animated, LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { dark } from '../lib/colors';

const ACC     = '#22d3ee';
const ACC_RGB = '34,211,238';

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  gradStart: string;
  gradEnd: string;
  title: string;
  body: string;
  bullets?: string[];
}

const SLIDES: Slide[] = [
  {
    icon: 'map-outline',
    iconColor: ACC,
    gradStart: `rgba(${ACC_RGB},0.15)`,
    gradEnd: 'transparent',
    title: 'Your guide to Jamestown',
    body: "Chadakoin Now puts everything happening in your city in one place — built for people who actually live here.",
    bullets: [
      'Weather + snow emergency alerts',
      'Local news from Jamestown outlets',
      'Events, concerts, and things to do',
      'Sabres, JCC Jayhawks, and regional sports',
      'Recycling schedule and city services',
      'Places to eat, drink, and explore',
    ],
  },
  {
    icon: 'build-outline',
    iconColor: '#a78bfa',
    gradStart: 'rgba(167,139,250,0.15)',
    gradEnd: 'transparent',
    title: 'Why I built this',
    body: "I kept opening five different apps just to know what was happening in my own city. The weather app, the city website, Facebook events, the newspaper — nothing talked to each other.\n\nSo I built the app I wanted. One screen, everything local.",
  },
  {
    icon: 'heart-outline',
    iconColor: '#fb7185',
    gradStart: 'rgba(251,113,133,0.15)',
    gradEnd: 'transparent',
    title: 'What I hope you get',
    body: "I want this to feel like checking in with your city every morning. Something useful, not noisy. Something that makes you feel a little more connected to Jamestown — whether you've been here your whole life or just moved in.\n\nIf something's wrong, missing, or could be better: the feedback button is right there in Settings. I read everything.",
  },
];

interface Props {
  onDone: (dontShowAgain: boolean) => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const [slide, setSlide] = useState(0);
  const [dontShow, setDontShow] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isLast = slide === SLIDES.length - 1;

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
      // Re-sync animation position to new width
      slideAnim.setValue(-slide * w);
    }
  }

  function goNext() {
    if (!isLast) {
      Animated.timing(slideAnim, {
        toValue: -(slide + 1) * containerWidth,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setSlide(slide + 1));
    } else {
      onDone(dontShow);
    }
  }

  function goBack() {
    if (slide > 0) {
      Animated.timing(slideAnim, {
        toValue: -(slide - 1) * containerWidth,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setSlide(slide - 1));
    }
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Slides — rendered as a horizontal strip, animated by translateX */}
      <Animated.View style={[
        styles.strip,
        { width: containerWidth * SLIDES.length, transform: [{ translateX: slideAnim }] },
      ]}>
        {SLIDES.map((sl, i) => (
          <View key={i} style={[styles.slide, { width: containerWidth }]}>
            <LinearGradient
              colors={[sl.gradStart, sl.gradEnd] as any}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <SafeAreaView edges={['top']} style={styles.slideInner}>
              {/* Icon */}
              <View style={[styles.iconWrap, { backgroundColor: `${sl.iconColor}15`, borderColor: `${sl.iconColor}30` }]}>
                <Ionicons name={sl.icon} size={32} color={sl.iconColor} />
              </View>

              {/* Page counter */}
              <Text style={styles.counter}>{i + 1} of {SLIDES.length}</Text>

              {/* Title */}
              <Text style={styles.title}>{sl.title}</Text>

              {/* Body */}
              <Text style={styles.body}>{sl.body}</Text>

              {/* Bullet list */}
              {sl.bullets && (
                <View style={styles.bullets}>
                  {sl.bullets.map((b, bi) => (
                    <View key={bi} style={styles.bulletRow}>
                      <Ionicons name="checkmark-circle" size={14} color={`${sl.iconColor}90`} />
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              )}
            </SafeAreaView>
          </View>
        ))}
      </Animated.View>

      {/* Bottom bar — always visible */}
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === slide
                  ? { backgroundColor: ACC, width: 20 }
                  : { backgroundColor: 'rgba(255,255,255,0.2)', width: 6 },
              ]}
            />
          ))}
        </View>

        {/* Don't show again — only on last slide */}
        {isLast && (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Don't show this again</Text>
            <Switch
              value={dontShow}
              onValueChange={setDontShow}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: `rgba(${ACC_RGB},0.45)` }}
              thumbColor={dontShow ? ACC : 'rgba(255,255,255,0.35)'}
            />
          </View>
        )}

        {/* Navigation buttons */}
        <View style={styles.btnRow}>
          {slide > 0 ? (
            <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}

          <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>{isLast ? 'Got it' : 'Next'}</Text>
            <Ionicons
              name={isLast ? 'checkmark' : 'arrow-forward'}
              size={16}
              color={dark.bg}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Chadakoin Now · Built in Jamestown, NY</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.bg,
    overflow: 'hidden',
  },

  strip: {
    flex: 1,
    flexDirection: 'row',
  },
  slide: {
    flex: 1,
    overflow: 'hidden',
  },
  slideInner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 16,
  },

  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },

  counter: {
    fontFamily: 'Outfit', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)', marginBottom: 12,
  },

  title: {
    fontFamily: 'Syne', fontSize: 26, fontWeight: '800',
    color: '#fff', letterSpacing: -0.5, lineHeight: 32,
    marginBottom: 16,
  },

  body: {
    fontFamily: 'Outfit', fontSize: 15, color: 'rgba(255,255,255,0.65)',
    lineHeight: 24,
  },

  bullets: { marginTop: 20, gap: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bulletText: { fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.7)', flex: 1 },

  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: dark.bg,
    gap: 14,
  },

  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  dot:  { height: 6, borderRadius: 3 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  toggleLabel: {
    fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.55)',
  },

  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: ACC,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  nextBtnText: {
    fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: dark.bg,
  },

  footer: {
    fontFamily: 'Outfit', fontSize: 10, textAlign: 'center',
    color: 'rgba(255,255,255,0.15)', paddingBottom: 4,
  },
});
