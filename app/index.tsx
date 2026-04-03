import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, Animated, Easing, Platform, Linking, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/ThemeContext';
import { THEMES, ThemeId } from '../lib/themes';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse, ErrorBanner } from '../components/SkeletonPulse';
import { fetchWeather, WeatherData } from '../services/weather';
import { useCivicData } from '../hooks/useCivicData';
import * as WebBrowser from 'expo-web-browser';
import { getTodaysFact } from '../data/jamestown-facts';
import { PLACES, PLACE_CATEGORIES, PlaceCategory } from '../data/places';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NowPlaying {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
}

async function fetchNowPlaying(): Promise<NowPlaying | null> {
  try {
    const url = Platform.OS === 'web'
      ? '/api/cdir'
      : 'https://radio.chadakoindigital.com/now.json';
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title:   data.title   ?? '',
      artist:  data.artist  ?? '',
      album:   data.album   ?? '',
      artwork: data.artwork?.startsWith('http')
        ? data.artwork
        : data.artwork
          ? `https://radio.chadakoindigital.com${data.artwork}`
          : undefined,
    };
  } catch { return null; }
}

function getDateBadge() {
  const d = new Date();
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

// Returns a countdown note when within 60 days of a mode switch, otherwise null.
function getParkingModeNote(): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const month = today.getMonth() + 1; // 1-indexed
  const isDaily = month >= 11 || month <= 3;
  if (isDaily) {
    const year = month >= 4 ? today.getFullYear() + 1 : today.getFullYear();
    const end = new Date(year, 3, 1); // Apr 1
    const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 60) return null;
    return `${days} day${days !== 1 ? 's' : ''} until monthly switching (Apr 1)`;
  }
  const year = month >= 11 ? today.getFullYear() + 1 : today.getFullYear();
  const end = new Date(year, 10, 1); // Nov 1
  const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days > 60) return null;
  return `${days} day${days !== 1 ? 's' : ''} until daily switching (Nov 1)`;
}

function LiveDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: pulse }} />;
}

function ThemeSelector() {
  const { theme, themeId, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function toggle() {
    Animated.spring(anim, {
      toValue: open ? 0 : 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 3,
    }).start();
    setOpen(v => !v);
  }

  function select(id: ThemeId) {
    setThemeId(id);
    Animated.spring(anim, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 3 }).start();
    setOpen(false);
  }

  const opacity    = anim;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }
    : {};

  return (
    <View style={tsStyles.wrap}>
      {/* Trigger */}
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={[tsStyles.trigger, { borderColor: `rgba(${theme.accRGB},0.28)`, backgroundColor: `rgba(${theme.accRGB},0.08)` }]}
      >
        <View style={tsStyles.swatchRow}>
          {[theme.acc, theme.acc2, theme.acc3].map((c, i) => (
            <View key={i} style={[tsStyles.dot, { backgroundColor: c }]} />
          ))}
        </View>
        <Text style={[tsStyles.triggerLabel, { color: theme.acc }]}>{theme.label}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={11} color={`rgba(${theme.accRGB},0.6)`} />
      </TouchableOpacity>

      {/* Dropdown */}
      {open && (
        <Animated.View style={[
          tsStyles.dropdown,
          { opacity, transform: [{ translateY }], borderColor: `rgba(${theme.accRGB},0.2)`, backgroundColor: 'rgba(8,12,20,0.96)' },
          // @ts-ignore
          glassWeb,
        ]}>
          {THEMES.map((t, i) => {
            const isActive = t.id === themeId;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => select(t.id as ThemeId)}
                activeOpacity={0.7}
                style={[
                  tsStyles.option,
                  i < THEMES.length - 1 && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
                ]}
              >
                <View style={tsStyles.swatchRow}>
                  {[t.acc, t.acc2, t.acc3].map((c, j) => (
                    <View key={j} style={[tsStyles.dot, { backgroundColor: c, opacity: isActive ? 1 : 0.5 }]} />
                  ))}
                </View>
                <Text style={[tsStyles.optionLabel, { color: isActive ? t.acc : 'rgba(255,255,255,0.75)' }]}>
                  {t.label}
                </Text>
                {isActive && <Ionicons name="checkmark" size={14} color={t.acc} />}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const tsStyles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 200, alignSelf: 'flex-start' },
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  triggerLabel: { fontFamily: 'Syne', fontSize: 12, fontWeight: '700' },
  dropdown: {
    position: 'absolute',
    top: 42,
    left: 0,
    width: 220,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 300,
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  optionLabel: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700' },
});

function StatChip({ label, value, accRGB, loading }: { label: string; value: string; accRGB: string; loading?: boolean }) {
  return (
    <View style={[styles.statChip, { backgroundColor: `rgba(${accRGB},0.08)`, borderColor: `rgba(${accRGB},0.18)` }]}>
      <Text style={[styles.statLabel, { color: `rgba(${accRGB},0.65)` }]}>{label}</Text>
      {loading
        ? <SkeletonPulse width={40} height={14} borderRadius={4} accRGB={accRGB} />
        : <Text style={styles.statValue}>{value}</Text>
      }
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────
export default function HomeScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [visitorMode, setVisitorMode] = useState(false);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const radioPlayer = useAudioPlayer({ uri: 'https://radio.chadakoindigital.com/radio.mp3' });
  const civic = useCivicData();

  // Load persisted visitor preference on first mount
  useEffect(() => {
    AsyncStorage.getItem('visitorMode').then(val => {
      if (val === 'true') setVisitorMode(true);
    }).catch(() => {});
  }, []);

  function toggleVisitorMode() {
    setVisitorMode(v => {
      const next = !v;
      AsyncStorage.setItem('visitorMode', String(next)).catch(() => {});
      return next;
    });
  }

  async function toggleRadio() {
    if (radioLoading) return;

    if (radioPlaying) {
      radioPlayer.pause();
      setRadioPlaying(false);
    } else {
      setRadioLoading(true);
      try {
        await setAudioModeAsync({ playsInSilentModeIOS: true });
        radioPlayer.play();
        setRadioPlaying(true);
      } catch {
        // fallback: open in browser if native audio fails
        setRadioPlaying(false);
        WebBrowser.openBrowserAsync('https://radio.chadakoindigital.com').catch(() => {});
      } finally {
        setRadioLoading(false);
      }
    }
  }

  const dateBadge = getDateBadge();

  useEffect(() => {
    fetchWeather().then(setWeather).catch(() => {});
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      fetchWeather().then(setWeather).catch(() => {}),
      fetchNowPlaying().then(setNowPlaying).catch(() => {}),
      civic.refresh(),
    ]);
    setRefreshing(false);
  }

  // Poll CDIR every 30 seconds
  useEffect(() => {
    fetchNowPlaying().then(setNowPlaying).catch(() => {});
    const id = setInterval(() => {
      fetchNowPlaying().then(setNowPlaying).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};
  // Base panel — used for general cards
  const panel     = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.05)`, borderColor: `rgba(${theme.accRGB},0.16)`, ...glassWeb };
  // Weather / primary panels — acc (primary)
  const panelGlow = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.07)`, borderColor: `rgba(${theme.accRGB},0.22)`, ...glassWeb };
  // Recycling panel — acc2 (secondary)
  const panel2    = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.acc2RGB},0.05)`, borderColor: `rgba(${theme.acc2RGB},0.16)`, ...glassWeb };
  // News / subtle panel — acc3 (tertiary)
  const panel3    = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.acc3RGB},0.04)`, borderColor: `rgba(${theme.acc3RGB},0.12)`, ...glassWeb };

  const { parking, recycling, alerts } = civic;

  // Snow emergency: any active alert containing "snow emergency"
  const snowEmergency = alerts.activeAlerts.find(a =>
    a.title.toLowerCase().includes('snow emergency')
  );

  return (
    <ThemedBackground>
      {/* ─── Header ─────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>
              {visitorMode ? 'Welcome to Jamestown' : 'Chadakoin Now'}
            </Text>
            <Text style={[styles.appCity, { color: theme.acc55 }]}>
              {visitorMode ? 'Your weekend guide' : 'Jamestown, NY'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.dateBadge, { backgroundColor: `rgba(${theme.accRGB},0.1)`, borderColor: `rgba(${theme.accRGB},0.22)` }]}>
              <LiveDot color={theme.acc} />
              <Text style={[styles.dateBadgeText, { color: theme.acc }]}>{dateBadge}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.7} style={{ padding: 4 }}>
              <Ionicons name="settings-outline" size={18} color={`rgba(${theme.accRGB},0.45)`} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Theme dots — tap to cycle, full details in Settings */}
        <View style={styles.themeDots}>
          {THEMES.map(t => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setThemeId(t.id as ThemeId)}
              activeOpacity={0.7}
              style={styles.dotWrap}
            >
              <View style={[
                styles.dot,
                {
                  backgroundColor: t.swatchColor,
                  opacity: themeId === t.id ? 1 : 0.25,
                  transform: [{ scale: themeId === t.id ? 1.35 : 1 }],
                  shadowColor: themeId === t.id ? t.swatchColor : 'transparent',
                  shadowOpacity: themeId === t.id ? 0.8 : 0,
                  shadowRadius: 5,
                },
              ]} />
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {civic.error && <ErrorBanner message={civic.error} accRGB={theme.accRGB} />}

      {/* ─── Visitor mode toggle ──────────────────── */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={toggleVisitorMode}
        // @ts-ignore
        style={[styles.visitorToggle, {
          backgroundColor: visitorMode ? `rgba(${theme.acc2RGB},0.15)` : `rgba(${theme.accRGB},0.06)`,
          borderColor: visitorMode ? `rgba(${theme.acc2RGB},0.4)` : `rgba(${theme.accRGB},0.12)`,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {}),
        }]}
      >
        <Text style={{ fontSize: 16 }}>{visitorMode ? '🏠' : '🧳'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.visitorLabel, { color: visitorMode ? theme.acc2 : 'rgba(255,255,255,0.6)' }]}>
            {visitorMode ? 'Visitor mode · Tap to switch to resident view' : 'Visiting Jamestown this weekend?'}
          </Text>
        </View>
        <View style={[styles.visitorPill, {
          backgroundColor: visitorMode ? `rgba(${theme.acc2RGB},0.2)` : 'rgba(255,255,255,0.06)',
          borderColor: visitorMode ? `rgba(${theme.acc2RGB},0.4)` : 'rgba(255,255,255,0.12)',
        }]}>
          <Text style={[styles.visitorPillText, { color: visitorMode ? theme.acc2 : 'rgba(255,255,255,0.35)' }]}>
            {visitorMode ? 'ON' : 'TAP'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ─── Snow emergency banner ─────────────────── */}
      {snowEmergency && (
        <View style={styles.snowBanner}>
          <Ionicons name="snow" size={18} color="#fff" />
          <View style={styles.snowBannerText}>
            <Text style={styles.snowBannerTitle}>Snow Emergency Active</Text>
            <Text style={styles.snowBannerBody} numberOfLines={2}>
              {snowEmergency.title}
            </Text>
          </View>
          {snowEmergency.link ? (
            <TouchableOpacity onPress={() => Linking.openURL(snowEmergency.link)} activeOpacity={0.7}>
              <Text style={styles.snowBannerLink}>Details →</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.acc}
            colors={[theme.acc]}
          />
        }
      >

        {/* ─── Weather ──────────────────────────────── */}
        {/* @ts-ignore */}
        <View style={[styles.card, panelGlow]}>
          {weather ? (
            <>
              <View style={styles.weatherTop}>
                <View>
                  <Text style={[styles.weatherTemp, { textShadowColor: `rgba(${theme.accRGB},0.45)`, textShadowRadius: 40 }]}>
                    {weather.temp}
                  </Text>
                  {/* condition uses acc2 for contrast against the temp */}
                  <Text style={[styles.weatherCondition, { color: theme.acc2 }]}>{weather.condition}</Text>
                </View>
                <View style={styles.weatherRight}>
                  <Text style={styles.weatherIcon}>{weather.icon}</Text>
                  <Text style={styles.weatherHL}>H {weather.high} · L {weather.low}</Text>
                </View>
              </View>
              <View style={styles.statRow}>
                <StatChip
                  label={weather.precipAt ? `RAIN ~ ${weather.precipAt}` : 'PRECIP'}
                  value={weather.precip}
                  accRGB={theme.acc2RGB}
                />
                <StatChip label="WIND" value={weather.wind} accRGB={theme.acc2RGB} />
                <StatChip label="H / L" value={`${weather.high} / ${weather.low}`} accRGB={theme.acc2RGB} />
                {weather.humidity && <StatChip label="HUMIDITY" value={weather.humidity} accRGB={theme.acc2RGB} />}
              </View>

              {/* 5-day forecast strip */}
              {weather.forecast && weather.forecast.length > 1 && (
                <View style={[styles.forecastStrip, { borderTopColor: `rgba(${theme.acc2RGB},0.12)` }]}>
                  {weather.forecast.map((day, i) => {
                    const d = new Date(day.date + 'T12:00:00');
                    const label = i === 0 ? 'Today'
                      : i === 1 ? 'Tmrw'
                      : d.toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <View key={day.date} style={styles.forecastDay}>
                        <Text style={[styles.forecastLabel, { color: `rgba(${theme.acc2RGB},0.5)` }]}>{label}</Text>
                        <Text style={styles.forecastIcon}>{day.icon}</Text>
                        <Text style={[styles.forecastHigh, { color: theme.acc2 }]}>{day.high}°</Text>
                        <Text style={[styles.forecastLow, { color: `rgba(${theme.acc2RGB},0.38)` }]}>{day.low}°</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <View style={styles.weatherLoading}>
              <SkeletonPulse width={100} height={56} borderRadius={8} accRGB={theme.accRGB} style={{ marginBottom: 8 }} />
              <SkeletonPulse width={80} height={14} borderRadius={4} accRGB={theme.accRGB} />
            </View>
          )}
        </View>

        {visitorMode ? (
          /* ═══════════════════════════════════════════
             VISITOR MODE
          ═══════════════════════════════════════════ */
          <>
            {/* Featured places */}
            {PLACES.filter(p => p.featured).map((place, idx) => (
              <TouchableOpacity
                key={place.id}
                activeOpacity={0.75}
                onPress={() => place.website && Linking.openURL(place.website)}
                // @ts-ignore
                style={[styles.card, {
                  borderRadius: 20, borderWidth: 1.5,
                  backgroundColor: `rgba(${theme.acc2RGB},0.1)`,
                  borderColor: `rgba(${theme.acc2RGB},0.35)`,
                  marginTop: idx > 0 ? 10 : 0,
                  ...(Platform.OS === 'web' ? { backdropFilter: 'blur(30px)' } : {}),
                }]}
              >
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={9} color={theme.acc2} style={{ marginRight: 4 }} />
                  <Text style={[styles.featuredBadgeText, { color: theme.acc2 }]}>FEATURED</Text>
                </View>
                <View style={styles.placeRow}>
                  <Ionicons name={place.icon as any} size={26} color={theme.acc2} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.placeName, { color: theme.acc2 }]}>{place.name}</Text>
                    {place.featuredNote && <Text style={styles.placeFeaturedNote}>{place.featuredNote}</Text>}
                    <Text style={styles.placeDesc} numberOfLines={2}>{place.description}</Text>
                    {place.hours && <Text style={[styles.placeHours, { color: `rgba(${theme.acc2RGB},0.5)` }]}>{place.hours}</Text>}
                  </View>
                  {place.website && <Ionicons name="open-outline" size={14} color={`rgba(${theme.acc2RGB},0.4)`} />}
                </View>
              </TouchableOpacity>
            ))}

            {/* Places by category */}
            {PLACE_CATEGORIES.map(cat => {
              const items = PLACES.filter(p => p.category === cat.key && !p.featured);
              if (items.length === 0) return null;
              return (
                <View key={cat.key}>
                  <View style={styles.sectionLabelRow}>
                    <Ionicons name={cat.icon as any} size={11} color={`rgba(${theme.accRGB},0.5)`} />
                    <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.5)`, marginTop: 0, marginBottom: 0, paddingLeft: 0 }]}>
                      {cat.label.toUpperCase()}
                    </Text>
                  </View>
                  {cat.note && (
                    <Text style={[styles.categoryNote, { color: `rgba(${theme.accRGB},0.45)` }]}>
                      {cat.note}
                    </Text>
                  )}
                  {/* @ts-ignore */}
                  <View style={[styles.card, panel, { padding: 0, overflow: 'hidden' }]}>
                    {items.map((place, i) => (
                      <TouchableOpacity
                        key={place.id}
                        activeOpacity={place.website ? 0.7 : 1}
                        onPress={() => place.website && Linking.openURL(place.website)}
                        style={[styles.placeListRow, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: `rgba(${theme.accRGB},0.08)` }]}
                      >
                        <Ionicons name={place.icon as any} size={18} color={`rgba(${theme.accRGB},0.65)`} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.placeListName}>{place.name}</Text>
                          <Text style={styles.placeListDesc}>{place.description}</Text>
                        </View>
                        {place.website && <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}

            {/* Weekend events */}
            {(() => {
              const now = new Date();
              const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
              const VISITOR_SKIP_TAGS = ['JPS', 'Athletics', 'Sports', 'Baseball', 'Tarp Skunks'];
              const weekend = civic.events.filter(e => {
                const d = new Date(e.startDate);
                if (d < now || d > soon) return false;
                // Skip school sports and athletics — not relevant to visitors
                return !e.tags.some(t => VISITOR_SKIP_TAGS.includes(t));
              }).slice(0, 4);
              if (weekend.length === 0) return null;
              return (
                <>
                  <Text style={[styles.sectionLabel, { color: `rgba(${theme.acc3RGB},0.5)` }]}>THIS WEEKEND</Text>
                  {weekend.map((e, i) => {
                    const d = new Date(e.startDate);
                    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    return (
                      // @ts-ignore
                      <TouchableOpacity key={i} activeOpacity={e.link ? 0.7 : 1} onPress={() => e.link && Linking.openURL(e.link)}
                        style={[styles.card, panel, { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }]}>
                        <View style={{ minWidth: 52 }}>
                          <Text style={[styles.sectionLabel, { color: theme.acc3, margin: 0, fontSize: 11 }]}>{dateStr}</Text>
                          <Text style={{ fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{timeStr}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: 'Outfit', fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={2}>{e.title}</Text>
                          <Text style={{ fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }} numberOfLines={1}>{e.location}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              );
            })()}
          </>
        ) : (
          /* ═══════════════════════════════════════════
             RESIDENT MODE (original content)
          ═══════════════════════════════════════════ */
          <>
        {/* ─── Parking Today ────────────────────────── */}
        {parking.active && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>PARKING TODAY</Text>
            {/* @ts-ignore */}
            <View style={[styles.card, panelGlow]}>
              {civic.loading ? (
                <>
                  <SkeletonPulse width={140} height={32} borderRadius={6} accRGB={theme.accRGB} style={{ marginBottom: 10 }} />
                  <SkeletonPulse width="90%" height={14} borderRadius={4} accRGB={theme.accRGB} />
                </>
              ) : (
                <>
                  <Text style={[styles.parkingSide, { color: theme.acc, textShadowColor: `rgba(${theme.accRGB},0.4)`, textShadowRadius: 30 }]}>
                    {parking.side === 'EVEN' ? 'Even side' : 'Odd side'}
                  </Text>
                  <Text style={styles.parkingRule}>
                    {parking.side === 'EVEN'
                      ? 'Park on the even-numbered side of the street today'
                      : 'Park on the odd-numbered side of the street today'}
                  </Text>
                  <View style={[styles.parkingNote, { borderTopColor: `rgba(${theme.accRGB},0.1)` }]}>
                    <Text style={[styles.parkingNoteText, { color: `rgba(${theme.accRGB},0.5)` }]}>
                      {parking.mode === 'daily' ? `Switches daily at ${parking.switchTime}` : 'Same side for the entire month'}
                    </Text>
                    {getParkingModeNote() && (
                      <Text style={[styles.parkingNoteText, { color: `rgba(${theme.accRGB},0.35)` }]}>
                        {getParkingModeNote()}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </View>
          </>
        )}

        {/* ─── Recycling This Week ──────────────────── */}
        {/* acc2 zone */}
        <Text style={[styles.sectionLabel, { color: `rgba(${theme.acc2RGB},0.5)` }]}>RECYCLING THIS WEEK</Text>
        {/* @ts-ignore */}
        <View style={[styles.card, panel2]}>
          {civic.loading ? (
            <>
              <SkeletonPulse width={140} height={32} borderRadius={6} accRGB={theme.acc2RGB} style={{ marginBottom: 10 }} />
              <SkeletonPulse width="90%" height={14} borderRadius={4} accRGB={theme.acc2RGB} />
            </>
          ) : (() => {
            // Split "Paper (newspaper, mail, magazines, office paper)" → name + detail
            const parenMatch = recycling.thisWeek.material.match(/^(.+?)\s*\((.+)\)$/);
            const materialName   = parenMatch ? parenMatch[1].trim() : recycling.thisWeek.material;
            const materialDetail = parenMatch ? parenMatch[2].trim() : '';
            const nextParenMatch = recycling.nextWeek.material.match(/^(.+?)\s*\((.+)\)$/);
            const nextName = nextParenMatch ? nextParenMatch[1].trim() : recycling.nextWeek.material;
            return (
              <>
                <Text style={[styles.recyclingName, {
                  color: theme.acc2,
                  textShadowColor: `rgba(${theme.acc2RGB},0.4)`,
                  textShadowRadius: 30,
                  fontSize: materialName.length > 20 ? 22 : 28,
                  lineHeight: materialName.length > 20 ? 26 : 34,
                }]}>
                  {materialName}
                </Text>
                {materialDetail ? (
                  <Text style={styles.recyclingDetail}>{materialDetail}</Text>
                ) : null}
                {recycling.thisWeek.note ? (
                  <Text style={[styles.recyclingDetail, { color: `rgba(${theme.acc2RGB},0.6)`, marginTop: -8 }]}>
                    {recycling.thisWeek.note}
                  </Text>
                ) : null}
                {recycling.thisWeek.exclusions ? (
                  <View style={[styles.recyclingNote, { borderTopColor: `rgba(${theme.acc2RGB},0.1)` }]}>
                    <Text style={[styles.recyclingNoteText, { color: `rgba(${theme.acc2RGB},0.5)` }]}>
                      Not accepted: {recycling.thisWeek.exclusions}
                    </Text>
                  </View>
                ) : null}
                {recycling.nextWeek.material !== '—' && (
                  <View style={[styles.recyclingNote, { borderTopColor: `rgba(${theme.acc2RGB},0.08)` }]}>
                    <Text style={[styles.recyclingNoteText, { color: `rgba(${theme.acc2RGB},0.35)` }]}>
                      Next week: {nextName}
                    </Text>
                  </View>
                )}
              </>
            );
          })()}
        </View>

        {/* Holiday delay banner — only shown when there's actually a delay */}
        {recycling.holidayDelay && (
          // @ts-ignore
          <View style={[styles.delayBanner, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' }]}>
            <Ionicons name="warning-outline" size={14} color="#f59e0b" />
            <Text style={styles.delayText}>
              Holiday this week — pickup schedule may shift by one day.
            </Text>
          </View>
        )}

        {/* ─── Jamestown history fact ───────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.acc }]}>DID YOU KNOW?</Text>
        {/* @ts-ignore */}
        <View style={[styles.card, panelGlow, styles.factCard, { borderLeftColor: theme.acc }]}>
          <Text style={[styles.factText, { color: 'rgba(255,255,255,0.88)' }]}>{getTodaysFact()}</Text>
        </View>


        {/* ─── LOTD latest episode ──────────────────── */}
        {(civic.loading || civic.latestEpisode) && (
          <>
            <Text style={[styles.sectionLabel, { color: `rgba(${theme.acc2RGB},0.5)` }]}>FROM JAMESTOWN</Text>
            {civic.loading ? (
              // @ts-ignore
              <View style={[styles.lotdCard, panel2]}>
                <SkeletonPulse width={40} height={40} borderRadius={8} accRGB={theme.acc2RGB} />
                <View style={{ flex: 1, gap: 6 }}>
                  <SkeletonPulse width="70%" height={14} borderRadius={4} accRGB={theme.acc2RGB} />
                  <SkeletonPulse width="45%" height={11} borderRadius={4} accRGB={theme.acc2RGB} />
                </View>
              </View>
            ) : civic.latestEpisode ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => WebBrowser.openBrowserAsync(civic.latestEpisode!.pageUrl).catch(() => {})}
                accessibilityLabel={`Play episode: ${civic.latestEpisode.title}`}
                accessibilityRole="button"
                // @ts-ignore
                style={[styles.lotdCard, panel2]}
              >
                <Image
                  source={{ uri: civic.latestEpisode.artworkUrl }}
                  style={[styles.lotdArt, { borderColor: `rgba(${theme.acc2RGB},0.3)` }]}
                  onError={() => {}}
                  accessibilityLabel="Episode artwork"
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lotdShow, { color: `rgba(${theme.acc2RGB},0.6)` }]}>
                    Live On Tape Delay
                    {civic.latestEpisode.episodeNumber ? ` · Ep. ${civic.latestEpisode.episodeNumber}` : ''}
                  </Text>
                  <Text style={[styles.lotdTagline, { color: `rgba(${theme.acc2RGB},0.35)` }]}>
                    Jamestown's longest running podcast
                  </Text>
                  <Text style={styles.lotdTitle} numberOfLines={1}>{civic.latestEpisode.title}</Text>
                  {civic.latestEpisode.duration ? (
                    <Text style={[styles.lotdDuration, { color: `rgba(${theme.acc2RGB},0.45)` }]}>
                      {civic.latestEpisode.duration}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.playBtn, { borderColor: `rgba(${theme.acc2RGB},0.3)` }]}>
                  <Ionicons name="play" size={18} color={`rgba(${theme.acc2RGB},0.7)`} />
                </View>
              </TouchableOpacity>
            ) : null}
          </>
        )}

        {/* ─── CDIR card ────────────────────────────── */}
        {/* @ts-ignore */}
        <View style={[styles.cdirCard, {
          borderRadius: 20, borderWidth: 1,
          backgroundColor: radioPlaying ? `rgba(${theme.accRGB},0.1)` : `rgba(${theme.accRGB},0.06)`,
          borderColor: radioPlaying ? `rgba(${theme.accRGB},0.35)` : `rgba(${theme.accRGB},0.18)`,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' } : {}),
        }]}>
          {/* Artwork — taps to open full site */}
          <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://radio.chadakoindigital.com').catch(() => {})} activeOpacity={0.8} accessibilityLabel="Open CDIR radio website" accessibilityRole="button">
            {nowPlaying?.artwork ? (
              <Image source={{ uri: nowPlaying.artwork }} style={styles.cdirArt} resizeMode="cover" />
            ) : (
              <View style={styles.cdirDotWrap}>
                <View style={[styles.cdirDot, { backgroundColor: theme.acc, shadowColor: theme.acc }]} />
              </View>
            )}
          </TouchableOpacity>

          {/* Track info */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.cdirTitle, { color: theme.acc }]}>CDIR</Text>
            {nowPlaying?.title ? (
              <>
                <Text style={styles.cdirNowLabel}>NOW PLAYING</Text>
                <Text style={styles.cdirTrack} numberOfLines={1}>{nowPlaying.title}</Text>
                <Text style={styles.cdirArtist} numberOfLines={1}>{nowPlaying.artist}</Text>
              </>
            ) : (
              <Text style={styles.cdirSub}>Local music and podcasts · 24/7</Text>
            )}
          </View>

          {/* Play / pause / loading */}
          <TouchableOpacity onPress={toggleRadio} activeOpacity={0.7} style={[styles.playBtn, { borderColor: `rgba(${theme.accRGB},0.3)`, backgroundColor: radioPlaying ? `rgba(${theme.accRGB},0.15)` : 'transparent' }]} accessibilityLabel={radioPlaying ? 'Stop radio' : 'Play CDIR radio'} accessibilityRole="button">
            {radioLoading
              ? <Ionicons name="hourglass-outline" size={18} color={theme.acc} />
              : radioPlaying
              ? <Ionicons name="pause" size={18} color={theme.acc} />
              : <Ionicons name="play" size={18} color={`rgba(${theme.accRGB},0.7)`} />
            }
          </TouchableOpacity>
        </View>

          <Text style={[styles.updatedLine, { color: `rgba(${theme.accRGB},0.3)` }]}>
            {civic.lastUpdated
              ? `Updated ${new Date(civic.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading…'}
          </Text>
          </>
        )}
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appName: { fontFamily: 'Syne', fontSize: 21, fontWeight: '700', color: '#fff', letterSpacing: 0.1 },
  appCity: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3, letterSpacing: 1.2 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  dateBadgeText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  themeDots: { flexDirection: 'row', gap: 12, marginTop: 14, alignItems: 'center' },
  dotWrap: { padding: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, shadowOffset: { width: 0, height: 0 } },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 6, paddingBottom: 40 },

  sectionLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: 8, marginTop: 18, paddingLeft: 2,
  },
  sectionLabel: {
    fontFamily: 'Outfit', fontSize: 9, fontWeight: '700',
    letterSpacing: 1.8, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 18, paddingLeft: 2,
  },

  card: { padding: 20, overflow: 'hidden' },

  // Weather
  weatherTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  weatherTemp: { fontFamily: 'Syne', fontSize: 62, fontWeight: '600', color: '#fff', lineHeight: 66, textShadowOffset: { width: 0, height: 0 } },
  weatherCondition: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', letterSpacing: 0.8, marginTop: 6 },
  weatherRight: { alignItems: 'flex-end', gap: 6, paddingTop: 4 },
  weatherIcon: { fontSize: 36 },
  weatherHL: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  forecastStrip: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 14, marginTop: 14 },
  forecastDay: { flex: 1, alignItems: 'center', gap: 4 },
  forecastLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  forecastIcon: { fontSize: 20 },
  forecastHigh: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '700' },
  forecastLow: { fontFamily: 'Outfit', fontSize: 11 },
  weatherLoading: { gap: 8 },
  statRow: { flexDirection: 'row', gap: 8 },
  statChip: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center', gap: 4 },
  statLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  statValue: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '600', color: '#fff' },

  // Parking
  parkingSide: { fontFamily: 'Syne', fontSize: 28, fontWeight: '700', lineHeight: 34, marginBottom: 8, textShadowOffset: { width: 0, height: 0 } },
  parkingRule: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 18 },
  parkingNote: { borderTopWidth: 1, paddingTop: 12, gap: 3 },
  parkingNoteText: { fontFamily: 'Outfit', fontSize: 11, letterSpacing: 0.3 },

  // Recycling — mirrors parking card style
  recyclingName: {
    fontFamily: 'Syne', fontSize: 28, fontWeight: '700', lineHeight: 34,
    marginBottom: 8, textShadowOffset: { width: 0, height: 0 },
  },
  recyclingDetail: {
    fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)',
    marginBottom: 16, lineHeight: 18,
  },
  recyclingNote: { borderTopWidth: 1, paddingTop: 12, gap: 3 },
  recyclingNoteText: { fontFamily: 'Outfit', fontSize: 11, letterSpacing: 0.3 },

  // Holiday delay banner
  delayBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8 },
  delayText: { fontFamily: 'Outfit', fontSize: 12, color: '#f59e0b', flex: 1, lineHeight: 17 },

  // Snow emergency banner
  snowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(220,0,50,0.18)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,50,80,0.35)',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  snowBannerText: { flex: 1, gap: 2 },
  snowBannerTitle: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: '#fff' },
  snowBannerBody: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 15 },
  snowBannerLink: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: '#ff6680' },

  // Visitor mode
  categoryNote: { fontFamily: 'Outfit', fontSize: 12, lineHeight: 17, marginBottom: 8, paddingHorizontal: 2 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featuredBadgeText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  placeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  placeName: { fontFamily: 'Syne', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  placeFeaturedNote: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 4, fontStyle: 'italic' },
  placeDesc: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  placeHours: { fontFamily: 'Outfit', fontSize: 11, marginTop: 4 },
  placeListRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  placeListName: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '600', color: '#fff' },
  placeListDesc: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  // History fact
  factCard: { borderLeftWidth: 3 },
  factText: { fontFamily: 'Outfit', fontSize: 14, lineHeight: 22 },



  // LOTD
  lotdCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  lotdTagline: { fontFamily: 'Outfit', fontSize: 10, marginTop: 1, marginBottom: 3, fontStyle: 'italic' },
  lotdArt: {
    width: 52, height: 52, borderRadius: 10, borderWidth: 1,
  },
  lotdShow: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  lotdTitle: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#fff' },
  lotdDuration: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3 },

  // Visitor toggle
  visitorToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    marginHorizontal: 16, marginBottom: 4,
  },
  visitorLabel: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '500' },
  visitorPill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  visitorPillText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  // CDIR
  cdirCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, marginTop: 10,
  },
  cdirArt: { width: 52, height: 52, borderRadius: 10 },
  cdirDotWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  cdirDot: {
    width: 10, height: 10, borderRadius: 5,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4,
  },
  playBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cdirTitle: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700' },
  cdirSub: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  cdirNowLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 3 },
  cdirTrack: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  cdirArtist: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  updatedLine: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28 },
});
