import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, Animated, Easing, Platform, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { THEMES, ThemeId } from '../lib/themes';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse, ErrorBanner } from '../components/SkeletonPulse';
import { fetchWeather, WeatherData } from '../services/weather';
import { useCivicData } from '../hooks/useCivicData';
import * as WebBrowser from 'expo-web-browser';
import { getTodaysFact } from '../data/jamestown-facts';
import { openLink } from '../lib/openLink';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import SettingsScreen from './settings';
import { AddToHomeScreen } from '../components/AddToHomeScreen';

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

function getParkingModeNote(): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const month = today.getMonth() + 1;
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
      <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.4)' }]}>{label}</Text>
      {loading
        ? <SkeletonPulse width={40} height={14} borderRadius={4} accRGB={accRGB} />
        : <Text style={styles.statValue}>{value}</Text>
      }
    </View>
  );
}

function ThemePillSwitcher() {
  const { themeId, setThemeId } = useTheme();

  // Animated widths for each dot — not compatible with useNativeDriver
  const dotWidths = useRef(
    Object.fromEntries(THEMES.map(t => [t.id, new Animated.Value(t.id === themeId ? 22 : 8)]))
  ).current;

  useEffect(() => {
    THEMES.forEach(t => {
      Animated.timing(dotWidths[t.id], {
        toValue: t.id === themeId ? 22 : 8,
        duration: 250,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();
    });
  }, [themeId]);

  return (
    <View style={styles.themeDots}>
      <Text style={styles.themeLabel}>THEME</Text>
      {THEMES.map(t => {
        const isActive = themeId === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => setThemeId(t.id as ThemeId)}
            activeOpacity={0.7}
            style={styles.dotWrap}
          >
            <Animated.View style={[
              styles.dot,
              {
                width: dotWidths[t.id],
                backgroundColor: t.swatchColor,
                opacity: isActive ? 1 : 0.25,
                shadowColor: isActive ? t.swatchColor : 'transparent',
                shadowOpacity: isActive ? 0.8 : 0,
                shadowRadius: isActive ? 6 : 0,
                elevation: isActive ? 4 : 0,
              },
            ]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const radioPlayer = useAudioPlayer({ uri: 'https://radio.chadakoindigital.com/radio.mp3' });
  const civic = useCivicData();

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
  const panel     = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.05)`, borderColor: `rgba(${theme.accRGB},0.16)`, ...glassWeb };
  const panelGlow = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.07)`, borderColor: `rgba(${theme.accRGB},0.22)`, ...glassWeb };
  const panel2    = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.acc2RGB},0.05)`, borderColor: `rgba(${theme.acc2RGB},0.16)`, ...glassWeb };
  const panel3    = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.acc3RGB},0.04)`, borderColor: `rgba(${theme.acc3RGB},0.12)`, ...glassWeb };

  const { parking, recycling, alerts } = civic;

  const snowEmergency = alerts.activeAlerts.find(a =>
    a.title.toLowerCase().includes('snow emergency')
  );

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>Chadakoin Now</Text>
            <Text style={[styles.appCity, { color: theme.acc55 }]}>Jamestown, NY</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.dateBadge, { backgroundColor: `rgba(${theme.accRGB},0.1)`, borderColor: `rgba(${theme.accRGB},0.22)` }]}>
              <LiveDot color={theme.acc} />
              <Text style={[styles.dateBadgeText, { color: theme.acc }]}>{dateBadge}</Text>
            </View>
            <TouchableOpacity onPress={() => setSettingsOpen(true)} activeOpacity={0.7} style={{ padding: 4 }}>
              <Ionicons name="settings-outline" size={18} color={`rgba(${theme.accRGB},0.45)`} />
            </TouchableOpacity>
          </View>
        </View>
        <ThemePillSwitcher />
      </SafeAreaView>

      {civic.error && <ErrorBanner message={civic.error} accRGB={theme.accRGB} />}



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
            <TouchableOpacity onPress={() => openLink(snowEmergency.link)} activeOpacity={0.7}>
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

        {/* @ts-ignore */}
        <View style={[styles.card, panelGlow]}>
          {weather ? (
            <>
              <View style={styles.weatherTop}>
                <View>
                  <Text style={[styles.weatherTemp, { textShadowColor: `rgba(${theme.accRGB},0.45)`, textShadowRadius: 40 }]}>
                    {weather.temp}
                  </Text>
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

        <>
        <Text style={[styles.sectionLabel, { color: `rgba(${theme.acc2RGB},0.5)` }]}>FROM JAMESTOWN</Text>

        {(civic.loading || civic.latestEpisode) && (
          <>
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
                  <Text style={[styles.lotdTagline, { color: theme.acc2, opacity: 0.8 }]}>
                    Jamestown's longest running podcast
                  </Text>
                  <Text style={styles.lotdTitle} numberOfLines={1}>{civic.latestEpisode.title}</Text>
                  {civic.latestEpisode.duration ? (
                    <Text style={[styles.lotdDuration, { color: `rgba(${theme.acc2RGB},0.45)` }]}>
                      {civic.latestEpisode.duration}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.playBtnFilled, {
                  backgroundColor: theme.acc2,
                  shadowColor: theme.acc2,
                }]}>
                  <Ionicons name="play" size={16} color={theme.bg} />
                </View>
              </TouchableOpacity>
            ) : null}
          </>
        )}

        {/* @ts-ignore */}
        <View style={[styles.cdirCard, {
          borderRadius: 20, borderWidth: 1,
          backgroundColor: radioPlaying ? `rgba(${theme.accRGB},0.1)` : `rgba(${theme.accRGB},0.06)`,
          borderColor: radioPlaying ? `rgba(${theme.accRGB},0.35)` : `rgba(${theme.accRGB},0.18)`,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' } : {}),
        }]}>
          <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://radio.chadakoindigital.com').catch(() => {})} activeOpacity={0.8} accessibilityLabel="Open CDIR radio website" accessibilityRole="button">
            {nowPlaying?.artwork ? (
              <Image source={{ uri: nowPlaying.artwork }} style={styles.cdirArt} resizeMode="cover" />
            ) : (
              <View style={styles.cdirDotWrap}>
                <View style={[styles.cdirDot, { backgroundColor: theme.acc, shadowColor: theme.acc }]} />
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={[styles.cdirTitle, { color: theme.acc }]}>CDIR</Text>
            <Text style={[styles.cdirStationName, { color: theme.acc }]}>Chadakoin Digital Internet Radio</Text>
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

          <View style={{ alignItems: 'center', gap: 5 }}>
            <View style={styles.cdirLiveRow}>
              <LiveDot color="#FF4D4D" />
              <Text style={styles.cdirLiveLabel}>LIVE</Text>
            </View>
            <View style={{ borderRadius: 18, shadowColor: theme.acc, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8, elevation: 4 }}>
            <TouchableOpacity
              onPress={toggleRadio}
              activeOpacity={0.7}
              style={[styles.playBtnFilled, { backgroundColor: theme.acc }]}
              accessibilityLabel={radioPlaying ? 'Stop radio' : 'Play CDIR radio'}
              accessibilityRole="button"
            >
              {radioLoading
                ? <Ionicons name="hourglass-outline" size={16} color={theme.bg} />
                : radioPlaying
                ? <Ionicons name="pause" size={16} color={theme.bg} />
                : <Ionicons name="play" size={16} color={theme.bg} />
              }
            </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.acc }]}>DID YOU KNOW?</Text>
        {/* @ts-ignore */}
        <View style={[styles.card, panelGlow, styles.factCard, { borderLeftColor: theme.acc, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}>
          <View style={styles.factIconRow}>
            <Ionicons name="book-outline" size={16} color={theme.acc} style={{ opacity: 0.7 }} />
          </View>
          <Text style={[styles.factText, { color: 'rgba(255,255,255,0.88)' }]}>{getTodaysFact()}</Text>
          <View style={styles.factFooter}>
            <Text style={styles.factFooterLeft}>Jamestown History</Text>
          </View>
        </View>

        {/* @ts-ignore */}
        <View style={[styles.recyclingCard, { borderColor: `rgba(${theme.acc2RGB},0.18)`, backgroundColor: `rgba(${theme.acc2RGB},0.04)`, marginTop: 18 }]}>
          <View style={styles.recyclingHeader}>
            <View style={{ flex: 1 }}>
              {civic.loading ? (
                <SkeletonPulse width={120} height={22} borderRadius={6} accRGB={theme.acc2RGB} />
              ) : (() => {
                const pm = recycling.thisWeek.material.match(/^(.+?)\s*\((.+)\)$/);
                const name = pm ? pm[1].trim() : recycling.thisWeek.material;
                return (
                  <Text style={[styles.recyclingCardName, { color: theme.acc2 }]}>{name}</Text>
                );
              })()}
              <Text style={[styles.recyclingCardSub, { color: `rgba(${theme.acc2RGB},0.45)` }]}>
                {recycling.thisWeek.dateRange || 'This week'}
              </Text>
            </View>
            <Ionicons name="sync-outline" size={28} color={`rgba(${theme.acc2RGB},0.7)`} />
          </View>

          {!civic.loading && (() => {
            const pm = recycling.thisWeek.material.match(/^(.+?)\s*\((.+)\)$/);
            const acceptedRaw = pm ? pm[2].trim() : '';
            // Keep only short, clean list items (skip paragraph-style BPU notes)
            const clean = (raw: string) =>
              raw.split(/,\s*/).map(s => s.trim()).filter(s => s.length > 1 && s.length <= 38).slice(0, 5);
            const accepted = clean(acceptedRaw);
            const excluded = recycling.thisWeek.exclusions ? clean(recycling.thisWeek.exclusions) : [];
            if (!accepted.length && !excluded.length) return null;
            return (
              <View style={styles.recyclingColumns}>
                {accepted.length > 0 && (
                  <View style={[styles.recyclingCol, { backgroundColor: `rgba(${theme.acc2RGB},0.06)`, borderColor: `rgba(${theme.acc2RGB},0.2)` }]}>
                    <Text style={[styles.recyclingColLabel, { color: theme.acc2 }]}>ACCEPTED</Text>
                    {accepted.map((item, i) => (
                      <Text key={i} style={[styles.recyclingColItem, { color: 'rgba(255,255,255,0.7)' }]}>· {item}</Text>
                    ))}
                  </View>
                )}
                {excluded.length > 0 && (
                  <View style={[styles.recyclingCol, { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.15)' }]}>
                    <Text style={[styles.recyclingColLabel, { color: '#ef4444' }]}>NOT ACCEPTED</Text>
                    {excluded.map((item, i) => (
                      <Text key={i} style={[styles.recyclingColItem, { color: 'rgba(255,255,255,0.55)' }]}>· {item}</Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}

          {!civic.loading && recycling.nextWeek.material !== '—' && (() => {
            const npm = recycling.nextWeek.material.match(/^(.+?)\s*\((.+)\)$/);
            const nextName = npm ? npm[1].trim() : recycling.nextWeek.material;
            return (
              <View style={[styles.recyclingNextRow, { borderTopColor: `rgba(${theme.acc2RGB},0.1)` }]}>
                <Ionicons name="calendar-outline" size={13} color={`rgba(${theme.acc2RGB},0.4)`} />
                <Text style={[styles.recyclingNextText, { color: `rgba(${theme.acc2RGB},0.4)` }]}>
                  Next week: {nextName}
                </Text>
              </View>
            );
          })()}
        </View>

        {recycling.holidayDelay && (
          // @ts-ignore
          <View style={[styles.delayBanner, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' }]}>
            <Ionicons name="warning-outline" size={14} color="#f59e0b" />
            <Text style={styles.delayText}>
              Holiday this week — pickup schedule may shift by one day.
            </Text>
          </View>
        )}

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

          <Text style={[styles.updatedLine, { color: `rgba(${theme.accRGB},0.3)` }]}>
            {civic.lastUpdated
              ? `Updated ${new Date(civic.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading…'}
          </Text>
        </>
      </ScrollView>
      <AddToHomeScreen />

      {settingsOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 500 }}>
          <SettingsScreen />
          <TouchableOpacity
            onPress={() => setSettingsOpen(false)}
            activeOpacity={0.7}
            style={{ position: 'absolute', top: 52, right: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 6 }}
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      )}
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
  themeDots: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  themeLabel: { fontFamily: 'Outfit', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginRight: 4 },
  dotWrap: { padding: 2 },
  dot: { height: 8, borderRadius: 4, shadowOffset: { width: 0, height: 0 } },

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
  parkingSide: { fontFamily: 'Syne', fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 8, textShadowOffset: { width: 0, height: 0 } },
  parkingRule: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 18 },
  parkingNote: { borderTopWidth: 1, paddingTop: 12, gap: 3 },
  parkingNoteText: { fontFamily: 'Outfit', fontSize: 11, letterSpacing: 0.3 },

  // Recycling two-column card
  recyclingCard: {
    borderRadius: 20, borderWidth: 1,
    overflow: 'hidden',
  },
  recyclingHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12,
  },
  recyclingCardName: { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  recyclingCardSub: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3 },
  recyclingCardEmoji: { fontSize: 28 },
  recyclingColumns: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  recyclingCol: {
    flex: 1, borderWidth: 1, borderRadius: 12, padding: 10,
  },
  recyclingColLabel: {
    fontFamily: 'Outfit', fontSize: 9, fontWeight: '700',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  recyclingColItem: { fontFamily: 'Outfit', fontSize: 10, lineHeight: 18 },
  recyclingNextRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  recyclingNextText: { fontFamily: 'Outfit', fontSize: 11 },

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


  // History fact
  factCard: { borderLeftWidth: 3 },
  factIconRow: { marginBottom: 8 },
  factText: { fontFamily: 'Outfit', fontSize: 13, lineHeight: 20 },
  factFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  factFooterLeft: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.25)' },
  factFooterRight: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.25)' },



  // LOTD
  lotdCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  lotdTagline: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '600', marginTop: 1, marginBottom: 3 },
  lotdArt: {
    width: 54, height: 54, borderRadius: 12, borderWidth: 1,
  },
  lotdShow: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  lotdTitle: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#fff' },
  lotdDuration: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3 },
  // Filled play button (LOTD)
  playBtnFilled: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8, elevation: 6,
  },

  // CDIR
  cdirCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, marginTop: 10,
  },
  cdirLiveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  cdirLiveLabel: {
    fontFamily: 'Outfit', fontSize: 9, fontWeight: '800',
    color: '#FF4D4D', letterSpacing: 1,
  },
  cdirArt: { width: 52, height: 52, borderRadius: 10 },
  cdirDotWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  cdirDot: {
    width: 10, height: 10, borderRadius: 5,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4,
  },
  playBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cdirTitle: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700' },
  cdirStationName: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '600', opacity: 0.8, marginTop: 2 },
  cdirSub: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  cdirNowLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 2 },
  cdirTrack: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  cdirArtist: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  updatedLine: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28 },
});
