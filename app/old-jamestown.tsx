import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Modal, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { OldJamestownStory } from '../data/oldJamestown';
import { oldJamestownImageSource } from '../lib/oldJamestownImages';
import { openLink } from '../lib/openLink';

const SEPIA = '#d4a574';

function shareStory(story: OldJamestownStory) {
  const url = `https://now.chadakoindigital.com/?story=${story.slug}`;
  Share.share({
    title: story.title,
    message: `${story.title} — Old Jamestown, via Chadakoin Now\n${url}`,
    url,
  }).catch(() => {});
}

export default function OldJamestownScreen({ story, onClose }: { story: OldJamestownStory; onClose?: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  const imageSource = oldJamestownImageSource(story.image);

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
            <Text style={ojs.eyebrow}>Old Jamestown</Text>
            <Text style={ojs.subtitle}>{story.year} · Jamestown, NY</Text>
          </View>
          <TouchableOpacity onPress={() => shareStory(story)} activeOpacity={0.7} style={ojs.shareBtn}>
            <Ionicons name="share-outline" size={18} color={SEPIA} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={ojs.scroll} contentContainerStyle={ojs.scrollContent}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setZoomed(true)} style={ojs.imageFrame}>
          <Image source={imageSource} style={ojs.image} resizeMode="contain" accessibilityLabel={story.imageAlt} />
          <View style={ojs.zoomHint}>
            <Ionicons name="expand-outline" size={12} color="#fff" />
            <Text style={ojs.zoomHintText}>Tap to zoom</Text>
          </View>
        </TouchableOpacity>

        <Text style={ojs.title}>{story.title}</Text>

        {story.body.map((para, i) => (
          <Text key={i} style={ojs.paragraph}>{para}</Text>
        ))}

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
              <Image source={imageSource} style={ojs.zoomImage} resizeMode="contain" accessibilityLabel={story.imageAlt} />
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={ojs.zoomScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              centerContent
              bouncesZoom
            >
              <Image source={imageSource} style={ojs.zoomImage} resizeMode="contain" accessibilityLabel={story.imageAlt} />
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
  eyebrow: { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  subtitle: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: SEPIA, letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 4 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 8, paddingBottom: 48, gap: 14 },

  imageFrame: {
    borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1008',
    borderWidth: 1, borderColor: 'rgba(196,154,97,0.3)',
  },
  image: { width: '100%', height: 360 },
  zoomHint: {
    position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(20,14,8,0.75)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  zoomHintText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', color: '#fff' },

  title: { fontFamily: 'Editorial', fontSize: 21, fontWeight: '700', color: '#fff', lineHeight: 27 },
  paragraph: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 22, color: 'rgba(237,220,200,0.88)' },

  sourceBlock: {
    marginTop: 8, padding: 14, borderRadius: 10,
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
