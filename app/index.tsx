import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, Animated, Easing, Platform, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/ThemeContext';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { fetchWeather, WeatherData } from '../services/weather';
import { useCivicData, EventItem, NewsItem } from '../hooks/useCivicData';
import * as WebBrowser from 'expo-web-browser';
import { getTodaysFact } from '../data/jamestown-facts';
import { openLink } from '../lib/openLink';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import SettingsScreen from './settings';
import CityServicesScreen from './city-services';
import { AddToHomeScreen } from '../components/AddToHomeScreen';
import { WaterTitle } from '../components/WaterTitle';
import { dark } from '../lib/colors';

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
    const end = new Date(year, 3, 1);
    const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 60) return null;
    return `${days}d until monthly`;
  }
  const year = month >= 11 ? today.getFullYear() + 1 : today.getFullYear();
  const end = new Date(year, 10, 1);
  const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days > 60) return null;
  return `${days}d until daily`;
}

function LiveDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.2, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: pulse }} />;
}

// Returns the first upcoming Sat/Sun event within the next 8 days
function getThisWeekendEvent(events: EventItem[]): EventItem | null {
  const now = new Date();
  const today = now.getDay(); // 0=Sun, 6=Sat
  // Window: from nearest upcoming Saturday (or today if Sat/Sun) through Sunday
  let windowStart = new Date(now);
  if (today === 0) {
    windowStart.setHours(0, 0, 0, 0); // today is Sunday
  } else if (today === 6) {
    windowStart.setHours(0, 0, 0, 0); // today is Saturday
  } else {
    windowStart.setDate(now.getDate() + (6 - today));
    windowStart.setHours(0, 0, 0, 0);
  }
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowStart.getDate() + (today === 0 ? 0 : 1));
  windowEnd.setHours(23, 59, 59, 999);

  return events.find(e => {
    const d = new Date(e.startDate);
    const day = d.getDay();
    return (day === 6 || day === 0) && d >= now && d <= windowEnd;
  }) ?? null;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

// Derive a color from a news story's title + source — mirrors news.tsx logic
function storyColor(title: string, source: string): string {
  const t = title.toLowerCase();
  const s = source.toLowerCase();
  if (/\b(jcc|jamestown community college)\b/i.test(t) || s.includes('jcc')) return '#a78bfa';
  if (/breaking|urgent|alert|emergency/i.test(t)) return '#ef4444';
  if (/dies|died|killed|fatal|crash|accident|shooting|arrested|injured|missing/i.test(t)) return '#fb923c';
  if (/music|concert|band|jazz|blues|rock|festival/i.test(t)) return '#fb7185';
  if (/school board|city council|mayor|budget|vote|election|municipal/i.test(t)) return '#22d3ee';
  if (/governor|legislature|assembly|senate|nys|albany/i.test(t)) return '#fbbf24';
  if (s.includes('city') || s.includes('jamestown') || s.includes('bpu')) return '#22d3ee';
  if (s.includes('nys') || s.includes('dec') || s.includes('dot')) return '#fbbf24';
  return '#34d399'; // community
}

function eventCategoryColor(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('music') || c.includes('concert')) return dark.category.music;
  if (c.includes('film') || c.includes('screen')) return dark.category.film;
  if (c.includes('art') || c.includes('exhibit') || c.includes('theater') || c.includes('theatre')) return dark.category.arts;
  return dark.category.community;
}

export default function HomeScreen({ onNavigateToTab }: { onNavigateToTab?: (index: number) => void }) {
  const { theme } = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cityServicesOpen, setCityServicesOpen] = useState(false);
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
        await setAudioModeAsync({ playsInSilentMode: true });
        radioPlayer.play();
        setRadioPlaying(true);
      } catch {
        setRadioPlaying(false);
        WebBrowser.openBrowserAsync('https://radio.chadakoindigital.com').catch(() => {});
      } finally {
        setRadioLoading(false);
      }
    }
  }

  const dateBadge = getDateBadge();

  // Shimmer sweep on the app title — fires every 15 seconds
  const shimmerAnim = useRef(new Animated.Value(-100)).current;
  useEffect(() => {
    function runShimmer() {
      shimmerAnim.setValue(-100);
      Animated.timing(shimmerAnim, {
        toValue: 320,
        duration: 750,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    // First shimmer fires after 3 s so it's noticeable on load
    const first = setTimeout(runShimmer, 3000);
    const id = setInterval(runShimmer, 15000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);

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
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any
    : {};

  const { parking, recycling, alerts } = civic;

  const snowEmergency = alerts.activeAlerts.find(a =>
    a.title.toLowerCase().includes('snow emergency')
  );

  const topStory: NewsItem | null = civic.news.length > 0 ? civic.news[0] : null;
  const weekendEvent = getThisWeekendEvent(civic.events);

  // Simplify recycling material name — strip parenthetical
  const recyclingRaw = recycling.thisWeek.material;
  const recyclingMatch = recyclingRaw.match(/^(.+?)\s*\((.+)\)$/);
  const recyclingName = recyclingMatch ? recyclingMatch[1].trim() : recyclingRaw;

  const updatedTime = civic.lastUpdated
    ? new Date(civic.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <ThemedBackground>

      {/* ── Header ─────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <WaterTitle />
            <Text style={styles.appCity}>Jamestown, NY</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.dateBadge}>
              <LiveDot color={dark.category.city} />
              <Text style={styles.dateBadgeText}>{dateBadge}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSettingsOpen(true)}
              activeOpacity={0.7}
              style={styles.settingsBtn}
            >
              <Ionicons name="settings-outline" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Snow emergency banner ──────────────────────── */}
      {snowEmergency && (
        <View style={styles.snowBanner}>
          <Ionicons name="snow" size={18} color="#fff" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.snowBannerTitle}>Snow Emergency Active</Text>
            <Text style={styles.snowBannerBody} numberOfLines={2}>{snowEmergency.title}</Text>
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
            tintColor={dark.category.city}
            colors={[dark.category.city]}
          />
        }
      >

        {/* ── Weather ────────────────────────────────────── */}
        {/* @ts-ignore */}
        <View style={[styles.card, glassWeb]}>
          {weather ? (
            <>
              <View style={styles.weatherTop}>
                <View>
                  <Text style={styles.weatherTemp}>{weather.temp}</Text>
                  <Text style={styles.weatherCondition}>{weather.condition}</Text>
                  <Text style={styles.weatherInline}>
                    H {weather.high} · L {weather.low} · Rain {weather.precip}
                    {weather.precipAt ? ` · ~${weather.precipAt}` : ''}
                  </Text>
                </View>
                <Text style={styles.weatherIcon}>{weather.icon}</Text>
              </View>
              {weather.forecast && weather.forecast.length > 1 && (
                <View style={styles.forecastStrip}>
                  {weather.forecast.map((day, i) => {
                    const d = new Date(day.date + 'T12:00:00');
                    const label = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <View key={day.date} style={styles.forecastDay}>
                        <Text style={styles.forecastLabel}>{label}</Text>
                        <Text style={styles.forecastIcon}>{day.icon}</Text>
                        <Text style={styles.forecastHigh}>{day.high}°</Text>
                        <Text style={styles.forecastLow}>{day.low}°</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <View style={{ gap: 10 }}>
              <SkeletonPulse width={100} height={52} borderRadius={8} accRGB={theme.accRGB} />
              <SkeletonPulse width={160} height={14} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width="100%" height={60} borderRadius={8} accRGB={theme.accRGB} style={{ marginTop: 4 }} />
            </View>
          )}
        </View>

        {/* ── Today in Jamestown ─────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Today in Jamestown</Text>
        </View>

        <View style={styles.todayGrid}>
          {/* Recycling card */}
          {/* @ts-ignore */}
          <View style={[styles.todayCard, glassWeb]}>
            <View style={styles.todayCardTop}>
              <View style={[styles.categoryIcon, { backgroundColor: 'rgba(52,211,153,0.1)' }]}>
                <Ionicons name="sync-outline" size={14} color={dark.category.recycling} />
              </View>
              <Text style={[styles.todayCategoryLabel, { color: dark.category.recycling }]}>Recycling</Text>
            </View>
            {civic.loading ? (
              <>
                <SkeletonPulse width="80%" height={20} borderRadius={4} accRGB="52,211,153" style={{ marginBottom: 6 }} />
                <SkeletonPulse width="60%" height={12} borderRadius={4} accRGB="52,211,153" />
              </>
            ) : (
              <>
                <Text style={styles.todayCardTitle} numberOfLines={2}>
                  {recyclingName === '—' ? 'No pickup' : recyclingName}
                </Text>
                <Text style={styles.todayCardSub}>Pickup this week</Text>
                <Text style={styles.todayCardMeta}>{recycling.thisWeek.dateRange || '—'}</Text>
              </>
            )}
          </View>

          {/* Parking card */}
          {/* @ts-ignore */}
          <View style={[styles.todayCard, glassWeb]}>
            <View style={styles.todayCardTop}>
              <View style={[styles.categoryIcon, { backgroundColor: 'rgba(34,211,238,0.1)' }]}>
                <Ionicons name="car-outline" size={14} color={dark.category.parking} />
              </View>
              <Text style={[styles.todayCategoryLabel, { color: dark.category.parking }]}>Parking</Text>
            </View>
            {civic.loading ? (
              <>
                <SkeletonPulse width="80%" height={20} borderRadius={4} accRGB="34,211,238" style={{ marginBottom: 6 }} />
                <SkeletonPulse width="60%" height={12} borderRadius={4} accRGB="34,211,238" />
              </>
            ) : (
              <>
                <Text style={styles.todayCardTitle}>
                  {parking.side === 'EVEN' ? 'Even Side' : parking.side === 'ODD' ? 'Odd Side' : '—'}
                </Text>
                <Text style={styles.todayCardSub}>
                  {parking.side === 'EVEN' ? 'Park even-numbered' : parking.side === 'ODD' ? 'Park odd-numbered' : 'Check sign'}
                </Text>
                <Text style={styles.todayCardMeta}>
                  {parking.mode === 'daily' ? 'Switches daily' : 'Same all month'}
                  {getParkingModeNote() ? ` · ${getParkingModeNote()}` : ''}
                </Text>
              </>
            )}
          </View>
        </View>

        {recycling.holidayDelay && (
          // @ts-ignore
          <View style={[styles.delayBanner, glassWeb]}>
            <Ionicons name="warning-outline" size={14} color="#f59e0b" />
            <Text style={styles.delayText}>Holiday this week — pickup may shift by one day.</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => setCityServicesOpen(true)}
          activeOpacity={0.7}
          style={styles.moreServicesLink}
        >
          <Text style={styles.moreServicesText}>More city services</Text>
          <Ionicons name="chevron-forward" size={12} color={dark.text.subtle} />
        </TouchableOpacity>

        {/* ── Top Story ──────────────────────────────────── */}
        {(civic.loading || topStory) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Top Story</Text>
              {onNavigateToTab && (
                <TouchableOpacity onPress={() => onNavigateToTab(2)} activeOpacity={0.7} style={styles.sectionLinkRow}>
                  <Text style={styles.sectionLink}>All news</Text>
                  <Ionicons name="chevron-forward" size={11} color={dark.text.subtle} />
                </TouchableOpacity>
              )}
            </View>

            {civic.loading ? (
              // @ts-ignore
              <View style={[styles.card, glassWeb, { gap: 10 }]}>
                <SkeletonPulse width="100%" height={80} borderRadius={8} accRGB={theme.accRGB} />
                <SkeletonPulse width="90%" height={18} borderRadius={4} accRGB={theme.accRGB} />
                <SkeletonPulse width="50%" height={12} borderRadius={4} accRGB={theme.accRGB} />
              </View>
            ) : topStory ? (() => {
              const sColor = storyColor(topStory.title, topStory.source ?? '');
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => topStory.link ? openLink(topStory.link) : null}
                  // @ts-ignore
                  style={[styles.heroCard, glassWeb, { borderTopColor: sColor, borderTopWidth: 3 }]}
                >
                  <LinearGradient
                    colors={[`${sColor}40`, `${sColor}14`, 'rgba(15,23,42,0.0)'] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroGradient}
                  >
                    <Ionicons name="newspaper-outline" size={72} color={`${sColor}10`} style={styles.heroWatermark} />
                    <View style={[styles.heroBadge, { borderColor: `${sColor}30` }]}>
                      <LiveDot color={sColor} />
                      <Text style={[styles.heroBadgeText, { color: sColor }]}>
                        {topStory.source ?? 'News'} · {relativeTime(topStory.pubDate)}
                      </Text>
                    </View>
                  </LinearGradient>
                  <View style={styles.heroBody}>
                    <Text style={styles.heroTitle} numberOfLines={3}>{topStory.title}</Text>
                    <Text style={styles.heroMeta}>{topStory.source ?? 'WRFA-LP'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })() : null}
          </>
        )}

        {/* ── This Weekend ───────────────────────────────── */}
        {(civic.loading || weekendEvent) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>This Weekend</Text>
              {onNavigateToTab && (
                <TouchableOpacity onPress={() => onNavigateToTab(3)} activeOpacity={0.7} style={styles.sectionLinkRow}>
                  <Text style={styles.sectionLink}>All events</Text>
                  <Ionicons name="chevron-forward" size={11} color={dark.text.subtle} />
                </TouchableOpacity>
              )}
            </View>

            {civic.loading ? (
              // @ts-ignore
              <View style={[styles.card, glassWeb, { gap: 10 }]}>
                <SkeletonPulse width="70%" height={18} borderRadius={4} accRGB={theme.accRGB} />
                <SkeletonPulse width="45%" height={12} borderRadius={4} accRGB={theme.accRGB} />
              </View>
            ) : weekendEvent ? (() => {
              const startD = new Date(weekendEvent.startDate);
              const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const evtColor = eventCategoryColor(weekendEvent.category);
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => weekendEvent.link ? openLink(weekendEvent.link) : onNavigateToTab?.(3)}
                  // @ts-ignore
                  style={[styles.eventCard, glassWeb]}
                >
                  <View style={[styles.eventBar, { backgroundColor: evtColor }]} />
                  <View style={styles.eventDateBlock}>
                    <Text style={[styles.eventDayLabel, { color: evtColor }]}>{DAY_NAMES[startD.getDay()]}</Text>
                    <Text style={styles.eventDateNum}>{startD.getDate()}</Text>
                    <Text style={styles.eventTime}>
                      {startD.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle} numberOfLines={2}>{weekendEvent.title}</Text>
                    <Text style={styles.eventVenue} numberOfLines={1}>{weekendEvent.location}</Text>
                    <Text style={[styles.eventCategory, { color: evtColor }]}>{weekendEvent.category}</Text>
                  </View>
                </TouchableOpacity>
              );
            })() : null}
          </>
        )}

        {/* ── From Jamestown ─────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>From Jamestown</Text>
        </View>

        {/* CDIR */}
        {/* @ts-ignore */}
        <View style={[styles.mediaCard, {
          backgroundColor: radioPlaying ? 'rgba(34,211,238,0.1)' : dark.surface,
          borderColor: radioPlaying ? 'rgba(34,211,238,0.3)' : dark.border,
        }, glassWeb]}>
          <TouchableOpacity
            onPress={() => WebBrowser.openBrowserAsync('https://radio.chadakoindigital.com').catch(() => {})}
            activeOpacity={0.8}
            accessibilityLabel="Open CDIR website"
          >
            <View style={[styles.mediaArt, { backgroundColor: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.15)' }]}>
              {nowPlaying?.artwork ? (
                <Image source={{ uri: nowPlaying.artwork }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
              ) : (
                <Ionicons name="radio-outline" size={22} color={dark.category.city} />
              )}
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={styles.mediaLabelRow}>
              <Text style={[styles.mediaLabel, { color: dark.category.city, flex: 1 }]} numberOfLines={1}>Chadakoin Digital Internet Radio</Text>
              <View style={styles.liveChip}>
                <LiveDot color="#fb7185" />
                <Text style={styles.liveLabel}>LIVE</Text>
              </View>
            </View>
            {nowPlaying?.title ? (
              <>
                <Text style={styles.mediaTitle} numberOfLines={1}>{nowPlaying.title}</Text>
                <Text style={styles.mediaSub} numberOfLines={1}>{nowPlaying.artist}</Text>
              </>
            ) : (
              <Text style={styles.mediaSub}>Local music & podcasts · 24/7</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={toggleRadio}
            activeOpacity={0.7}
            style={[styles.playBtn, { backgroundColor: dark.category.city }]}
            accessibilityLabel={radioPlaying ? 'Stop radio' : 'Play CDIR radio'}
          >
            {radioLoading
              ? <Ionicons name="hourglass-outline" size={16} color="#060e18" />
              : radioPlaying
              ? <Ionicons name="pause" size={16} color="#060e18" />
              : <Ionicons name="play" size={16} color="#060e18" />
            }
          </TouchableOpacity>
        </View>

        {/* LOTD */}

        {/* ── Did You Know? ──────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Did You Know?</Text>
        </View>

        {/* @ts-ignore */}
        <View style={[styles.card, glassWeb]}>
          <View style={styles.factRow}>
            <View style={[styles.categoryIcon, { backgroundColor: 'rgba(251,191,36,0.1)', marginTop: 2 }]}>
              <Ionicons name="book-outline" size={14} color="#fbbf24" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.factText}>{getTodaysFact()}</Text>
              <Text style={styles.factMeta}>Jamestown History</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        {updatedTime && (
          <Text style={styles.updatedLine}>Updated {updatedTime}</Text>
        )}

      </ScrollView>

      <AddToHomeScreen />

      {/* Settings overlay */}
      {settingsOpen && (
        <View style={styles.overlay}>
          <SettingsScreen />
          <TouchableOpacity
            onPress={() => setSettingsOpen(false)}
            activeOpacity={0.7}
            style={styles.overlayClose}
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      )}

      {/* City Services overlay */}
      {cityServicesOpen && (
        <View style={styles.overlay}>
          <CityServicesScreen onClose={() => setCityServicesOpen(false)} />
        </View>
      )}

    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 40, zIndex: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appNameWrap: { overflow: 'hidden' },
  appName: { fontFamily: 'Syne', fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 80 },
  appCity: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: dark.category.city, letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 4 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.3)' },
  dateBadgeText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: dark.category.city, textTransform: 'uppercase' },
  settingsBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: dark.border },

  // Snow banner
  snowBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(220,0,50,0.18)', borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(255,50,80,0.35)', paddingHorizontal: 18, paddingVertical: 14,
  },
  snowBannerTitle: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: '#fff' },
  snowBannerBody: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 15 },
  snowBannerLink: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: '#ff6680' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8, paddingBottom: 48 },

  // Section header row
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10, paddingHorizontal: 2 },
  sectionLabel: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: dark.category.city, letterSpacing: 1.8, textTransform: 'uppercase' },
  sectionLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionLink: { fontFamily: 'Outfit', fontSize: 11, color: dark.text.subtle, fontWeight: '500' },

  // Base card
  card: { backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border, borderRadius: 16, padding: 18, overflow: 'hidden' },

  // Weather
  weatherTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  weatherTemp: { fontFamily: 'Syne', fontSize: 56, fontWeight: '700', color: '#fff', lineHeight: 60, letterSpacing: -1 },
  weatherCondition: { fontFamily: 'Outfit', fontSize: 14, fontWeight: '600', color: '#34d399', marginTop: 6 },
  weatherInline: { fontFamily: 'Outfit', fontSize: 12, color: dark.text.subtle, marginTop: 3 },
  weatherIcon: { fontSize: 52, marginTop: 4 },
  forecastStrip: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(30,41,59,0.6)', paddingTop: 14, marginTop: 16 },
  forecastDay: { flex: 1, alignItems: 'center', gap: 3 },
  forecastLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: dark.text.subtle },
  forecastIcon: { fontSize: 18 },
  forecastHigh: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '700', color: '#34d399' },
  forecastLow: { fontFamily: 'Outfit', fontSize: 11, color: '#475569' },

  // Today in Jamestown grid
  todayGrid: { flexDirection: 'row', gap: 12 },
  todayCard: { flex: 1, backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border, borderRadius: 16, padding: 14 },
  todayCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  categoryIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  todayCategoryLabel: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  todayCardTitle: { fontFamily: 'Syne', fontSize: 17, fontWeight: '700', color: dark.text.primary, lineHeight: 22, marginBottom: 4 },
  todayCardSub: { fontFamily: 'Outfit', fontSize: 11, color: dark.text.muted },
  todayCardMeta: { fontFamily: 'Outfit', fontSize: 10, color: '#475569', marginTop: 2 },

  // Delay banner
  delayBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: 10, marginTop: 8 },
  delayText: { fontFamily: 'Outfit', fontSize: 11, color: '#f59e0b', flex: 1, lineHeight: 16 },

  // More services link
  moreServicesLink: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: 10, paddingVertical: 4 },
  moreServicesText: { fontFamily: 'Outfit', fontSize: 11, color: dark.text.subtle },

  // Hero news card
  heroCard: { backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border, borderRadius: 16, overflow: 'hidden' },
  heroGradient: { height: 100, justifyContent: 'flex-end', padding: 12 },
  heroWatermark: { position: 'absolute', right: -16, bottom: -16 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', alignSelf: 'flex-start',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  heroBadgeText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', color: dark.category.city, letterSpacing: 0.5 },
  heroBody: { padding: 14 },
  heroTitle: { fontFamily: 'Syne', fontSize: 16, fontWeight: '700', color: dark.text.primary, lineHeight: 22, letterSpacing: -0.2 },
  heroMeta: { fontFamily: 'Outfit', fontSize: 11, color: dark.text.muted, marginTop: 6 },

  // Event card
  eventCard: { backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'stretch' },
  eventBar: { width: 4 },
  eventDateBlock: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minWidth: 64 },
  eventDayLabel: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  eventDateNum: { fontFamily: 'Syne', fontSize: 26, fontWeight: '700', color: '#fff', lineHeight: 28, marginTop: 2 },
  eventTime: { fontFamily: 'Outfit', fontSize: 10, color: dark.text.subtle, marginTop: 4 },
  eventBody: { flex: 1, paddingRight: 14, paddingVertical: 14, justifyContent: 'center' },
  eventTitle: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: dark.text.primary, lineHeight: 20, letterSpacing: -0.1 },
  eventVenue: { fontFamily: 'Outfit', fontSize: 11, color: dark.text.muted, marginTop: 4 },
  eventCategory: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 6 },

  // Media cards (CDIR + LOTD)
  mediaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 16, padding: 12, marginBottom: 8, overflow: 'hidden',
  },
  mediaArt: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  mediaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  mediaLabel: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '800', color: '#fb7185', letterSpacing: 1 },
  epNumber: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', color: dark.text.subtle, letterSpacing: 0.5 },
  mediaTitle: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: dark.text.primary },
  mediaSub: { fontFamily: 'Outfit', fontSize: 10, color: dark.text.subtle, marginTop: 2 },
  playBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  // Did You Know
  factRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  factText: { fontFamily: 'Outfit', fontSize: 13, color: dark.text.primary, lineHeight: 20 },
  factMeta: { fontFamily: 'Outfit', fontSize: 10, color: dark.text.subtle, marginTop: 8 },

  // Footer
  updatedLine: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', color: '#475569', marginTop: 24 },

  // Overlays
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 500 },
  overlayClose: { position: 'absolute', top: 52, right: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 6 },
});
