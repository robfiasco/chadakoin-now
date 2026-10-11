import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Modal, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { OLD_JAMESTOWN_STORIES, OLD_JAMESTOWN_HEADER_ASPECT, OldJamestownStory } from '../data/oldJamestown';
import { oldJamestownImageSource, oldJamestownHeaderSource } from '../lib/oldJamestownImages';
import { openLink } from '../lib/openLink';

const SEPIA = '#d4a574';

function shareStory(story: OldJamestownStory) {
  const url = `https://now.chadakoindigital.com/?story=${story.slug}`;
  Share.share({
    title: story.title,
    message: `${story.title} — From Jamestown's Archives, via Chadakoin Now\n${url}`,
    url,
  }).catch(() => {});
}

// The chronologically next story after this one, regardless of whether it
// has itself released yet — that's the point of a "coming up" teaser. Only
// the year + title are ever shown, never body text, per the brief's
// constraint on not revealing a story early.
function findNextStory(story: OldJamestownStory): OldJamestownStory | null {
  const sorted = [...OLD_JAMESTOWN_STORIES].sort((a, b) => a.publishDate.localeCompare(b.publishDate));
  const idx = sorted.findIndex(s => s.slug === story.slug);
  return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
}

export default function OldJamestownScreen({ story, onClose }: { story: OldJamestownStory; onClose?: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  const clippingSource = oldJamestownImageSource(story.image);
  const nextStory = findNextStory(story);

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={ojs.header}>
        <View style={ojs.headerRow}>
          {onClose && (
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={ojs.closeBtn}>
              <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={ojs.eyebrow}>From Jamestown’s Archives</Text>
            <Text style={ojs.tagline}>Stories from the city’s 1800s and early-1900s newspapers</Text>
            {/* Year omitted when the title already carries it (every story
                so far) — it's repeated right below in the headline. */}
            <Text style={ojs.subtitle}>
              {story.title.includes(String(story.year)) ? 'Jamestown, NY' : `${story.year} · Jamestown, NY`}
            </Text>
          </View>
          <TouchableOpacity onPress={() => shareStory(story)} activeOpacity={0.7} style={ojs.shareBtn}>
            <Ionicons name="share-outline" size={18} color={SEPIA} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={ojs.scroll} contentContainerStyle={ojs.scrollContent}>
        <View style={[ojs.heroFrame, { aspectRatio: OLD_JAMESTOWN_HEADER_ASPECT }]}>
          <Image
            source={oldJamestownHeaderSource(story.headerImage)}
            style={ojs.heroImage}
            resizeMode="cover"
            accessibilityLabel={story.headerImageAlt}
          />
        </View>

        <Text style={ojs.title}>{story.title}</Text>

        {story.body.map((para, i) => (
          <Text key={i} style={ojs.paragraph}>{para}</Text>
        ))}

        <View style={ojs.moreComing}>
          <Text style={ojs.moreComingText}>New stories every week from Jamestown’s old newspapers.</Text>
          {nextStory && (
            <Text style={ojs.moreComingNext}>Next week: {nextStory.year} — {nextStory.title}</Text>
          )}
        </View>

        <TouchableOpacity activeOpacity={0.85} onPress={() => setZoomed(true)} style={ojs.originalTile}>
          <Image source={clippingSource} style={ojs.originalThumb} resizeMode="cover" accessibilityLabel={story.imageAlt} />
          <View style={{ flex: 1 }}>
            <Text style={ojs.originalTitle}>See the original page</Text>
            <Text style={ojs.originalSub}>Tap to zoom the full clipping</Text>
          </View>
          <Ionicons name="expand-outline" size={16} color={SEPIA} />
        </TouchableOpacity>

        <View style={ojs.sourceBlock}>
          <TouchableOpacity onPress={() => openLink(story.sourceUrl)} activeOpacity={0.75}>
            <Text style={ojs.sourceLine}>
              From <Text style={ojs.sourceLink}>{story.sourceLabel}</Text>
              {'  '}<Ionicons name="open-outline" size={11} color={SEPIA} />
            </Text>
          </TouchableOpacity>
          <Text style={ojs.creditLine}>{story.credit}</Text>
        </View>
      </ScrollView>

      <Modal visible={zoomed} transparent animationType="fade" onRequestClose={() => setZoomed(false)}>
        <View style={ojs.zoomOverlay}>
          <TouchableOpacity
            onPress={() => setZoomed(false)}
            activeOpacity={0.7}
            style={ojs.zoomCloseBtn}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          {Platform.OS === 'web' ? (
            <ScrollView
              contentContainerStyle={ojs.zoomScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
            >
              <Image source={clippingSource} style={ojs.zoomImage} resizeMode="contain" accessibilityLabel={story.imageAlt} />
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={ojs.zoomScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              centerContent
              bouncesZoom
            >
              <Image source={clippingSource} style={ojs.zoomImage} resizeMode="contain" accessibilityLabel={story.imageAlt} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </ThemedBackground>
  );
}

const ojs = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  closeBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: 'rgba(196,154,97,0.25)', marginTop: 4 },
  shareBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(42,28,16,0.6)', borderWidth: 1, borderColor: 'rgba(196,154,97,0.3)', marginTop: 4 },
  eyebrow: { fontFamily: 'Syne', fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  tagline: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(237,220,200,0.6)', marginTop: 2, lineHeight: 15 },
  subtitle: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: SEPIA, letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 6 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 8, paddingBottom: 48, gap: 14 },

  // Fixed 1200:630 hero — resizeMode="cover" at this wide aspect ratio
  // always fills the frame with no letterboxing, unlike the old full
  // clipping hero (some clippings were tall/narrow, leaving dark bars down
  // the sides under "contain").
  heroFrame: {
    width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1008',
    borderWidth: 1, borderColor: 'rgba(196,154,97,0.3)',
  },
  heroImage: { width: '100%', height: '100%' },

  title: { fontFamily: 'Editorial', fontSize: 21, fontWeight: '700', color: '#fff', lineHeight: 27 },
  paragraph: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 22, color: 'rgba(237,220,200,0.88)' },

  moreComing: {
    padding: 12, borderRadius: 10, backgroundColor: 'rgba(212,165,116,0.08)',
    borderWidth: 1, borderColor: 'rgba(196,154,97,0.2)', gap: 3,
  },
  moreComingText: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: SEPIA },
  moreComingNext: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(237,220,200,0.6)' },

  originalTile: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10,
    backgroundColor: 'rgba(42,28,16,0.45)', borderWidth: 1, borderColor: 'rgba(196,154,97,0.25)',
  },
  originalThumb: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#1a1008' },
  originalTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },
  originalSub: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(237,220,200,0.55)', marginTop: 1 },

  sourceBlock: {
    padding: 14, borderRadius: 10,
    backgroundColor: 'rgba(42,28,16,0.45)', borderWidth: 1, borderColor: 'rgba(196,154,97,0.25)', gap: 4,
  },
  sourceLine: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(237,220,200,0.7)', lineHeight: 18 },
  sourceLink: { color: SEPIA, fontWeight: '700' },
  creditLine: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(237,220,200,0.5)' },

  zoomOverlay: { flex: 1, backgroundColor: 'rgba(6,3,1,0.97)' },
  zoomCloseBtn: {
    position: 'absolute', top: 48, right: 20, zIndex: 10, padding: 10, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  zoomScrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  zoomImage: { width: '100%', height: 600 },
});
