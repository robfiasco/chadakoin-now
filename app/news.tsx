import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse, ErrorBanner } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { useCivicData } from '../hooks/useCivicData';

function formatDate(str: string) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NewsScreen() {
  const { theme } = useTheme();
  const { news, loading, error } = useCivicData();

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};
  const card = {
    borderRadius: 16, borderWidth: 1,
    backgroundColor: `rgba(${theme.accRGB},0.07)`,
    borderColor: `rgba(${theme.accRGB},0.2)`,
    ...glassWeb,
  };

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Local News</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>
          WRFA-LP · City of Jamestown · Jackson Center
        </Text>
      </SafeAreaView>

      {error && <ErrorBanner message={error} accRGB={theme.accRGB} />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          [1,2,3,4,5].map(i => (
            // @ts-ignore
            <View key={i} style={[card, { padding: 18, gap: 8, marginBottom: 10 }]}>
              <SkeletonPulse width="85%" height={14} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width="100%" height={11} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width="100%" height={11} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width={60} height={10} borderRadius={4} accRGB={theme.accRGB} />
            </View>
          ))
        ) : news.length === 0 ? (
          // @ts-ignore
          <View style={[card, { padding: 18 }]}>
            <Text style={{ fontFamily: 'Outfit', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              No news available.
            </Text>
          </View>
        ) : (
          news.map((item, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={item.link ? 0.7 : 1}
              onPress={() => item.link && Linking.openURL(item.link)}
              // @ts-ignore
              style={[styles.item, card]}
            >
              <Text style={styles.itemTitle} numberOfLines={3}>{item.title}</Text>
              {item.excerpt ? (
                <Text style={styles.itemExcerpt} numberOfLines={3}>{item.excerpt}</Text>
              ) : null}
              <Text style={[styles.itemDate, { color: `rgba(${theme.accRGB},0.45)` }]}>
                {formatDate(item.pubDate)}
              </Text>
            </TouchableOpacity>
          ))
        )}
        <Text style={[styles.source, { color: `rgba(${theme.accRGB},0.25)` }]}>
          WRFA-LP 107.9 · jamestownny.gov · roberthjackson.org
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title: { fontFamily: 'Syne', fontSize: 21, fontWeight: '700', color: '#fff' },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3, letterSpacing: 0.5 },
  content: { padding: 16, paddingTop: 12, paddingBottom: 40, gap: 10 },
  item: { padding: 18, gap: 6 },
  itemTitle: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20 },
  itemExcerpt: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 18 },
  itemDate: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  source: { fontFamily: 'Outfit', fontSize: 10, textAlign: 'center', marginTop: 8 },
});
