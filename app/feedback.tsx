import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dark } from '../lib/colors';

const ACC     = '#22d3ee';
const ACC_RGB = '34,211,238';
const MAX_LEN = 1500;

const TYPES = [
  { key: 'general',    label: 'General feedback' },
  { key: 'bug',        label: 'Bug or issue' },
  { key: 'suggestion', label: 'Suggestion' },
  { key: 'correction', label: 'Correction (wrong hours, bad link, etc.)' },
  { key: 'business',   label: 'Featured Placement inquiry' },
];

const PLACEHOLDERS: Record<string, string> = {
  general:    "What's on your mind?",
  bug:        'What did you expect to happen? What actually happened? Which screen were you on?',
  suggestion: 'What would you like to see in the app?',
  correction: "Which business or event? What's wrong, and what should it be?",
  business:   "Tell us about your business and what you'd like to know about Featured Placement.",
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function FeedbackScreen({ onClose, initialType = 'general' }: { onClose: () => void; initialType?: string }) {
  const [formType, setFormType] = useState(initialType);
  const [message, setMessage]   = useState('');
  const [replyTo, setReplyTo]   = useState('');
  const [status, setStatus]     = useState<Status>('idle');

  const remaining = MAX_LEN - message.length;

  async function handleSubmit() {
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       formType,
          message:    message.trim(),
          replyTo:    replyTo.trim() || null,
          appVersion: '1.0.2',
          timestamp:  new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Send failed');
      setStatus('sent');
      setMessage('');
      setReplyTo('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <View style={s.container}>
        <SafeAreaView edges={['top']} style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.title}>Send feedback</Text>
              <Text style={s.subtitle}>Goes straight to Rob</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={s.sentWrap}>
          <View style={s.sentCard}>
            <View style={s.sentIconWrap}>
              <Ionicons name="checkmark" size={28} color="#34d399" />
            </View>
            <Text style={s.sentTitle}>Got it — thanks.</Text>
            <Text style={s.sentBody}>
              Your message landed in my inbox. If you left an email, I'll reply within a couple days.
            </Text>
            <TouchableOpacity onPress={() => setStatus('idle')} activeOpacity={0.7} style={{ marginTop: 24 }}>
              <Text style={s.sentReset}>Send another →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Send feedback</Text>
            <Text style={s.subtitle}>Goes straight to Rob</Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Intro card */}
          <View style={s.introCard}>
            <View style={s.introIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={ACC} />
            </View>
            <Text style={s.introText}>
              Find a bug? See wrong hours somewhere? Have an idea? Drop a note — it comes straight to me.
            </Text>
          </View>

          {/* Type selector */}
          <Text style={s.fieldLabel}>What's this about?</Text>
          <View style={s.typeList}>
            {TYPES.map(t => {
              const active = t.key === formType;
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setFormType(t.key)}
                  activeOpacity={0.7}
                  style={[s.typeRow, active && s.typeRowActive]}
                >
                  <View style={[s.typeRadio, active && s.typeRadioActive]} />
                  <Text style={[s.typeLabel, active && { color: '#fff' }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Message */}
          <View style={s.fieldHeader}>
            <Text style={s.fieldLabel}>Your message</Text>
            <Text style={[s.charCount, remaining < 100 && { color: '#fbbf24' }]}>
              {remaining} left
            </Text>
          </View>
          <TextInput
            style={s.textarea}
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={t => setMessage(t.slice(0, MAX_LEN))}
            placeholder={PLACEHOLDERS[formType]}
            placeholderTextColor="rgba(255,255,255,0.2)"
            textAlignVertical="top"
          />

          {/* Reply-to */}
          <View style={s.fieldHeader}>
            <Text style={s.fieldLabel}>
              Email for a reply{' '}
              <Text style={s.fieldLabelOptional}>(optional)</Text>
            </Text>
          </View>
          <TextInput
            style={s.input}
            value={replyTo}
            onChangeText={setReplyTo}
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={s.inputNote}>Only used so I can write you back. Not added to any list.</Text>

          {/* Error state */}
          {status === 'error' && (
            <View style={s.errorCard}>
              <Ionicons name="alert-circle-outline" size={16} color="#fb7185" />
              <Text style={s.errorText}>
                Something went wrong. Try again in a minute, or reach us directly at rob@robfiasco.dev.
              </Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={!message.trim() || status === 'sending'}
            style={[s.submitBtn, (!message.trim() || status === 'sending') && s.submitBtnDisabled]}
          >
            <Text style={s.submitText}>
              {status === 'sending' ? 'Sending…' : 'Send feedback'}
            </Text>
            {status !== 'sending' && (
              <Ionicons name="send" size={15} color="#060e18" />
            )}
          </TouchableOpacity>

          <Text style={s.footer}>Chadakoin Now v1.0.2 · Built by Chadakoin Digital</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },

  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: dark.border },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: 'Syne', fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: ACC, letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 4 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },

  content: { padding: 20, paddingBottom: 48, gap: 4 },

  introCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: `rgba(${ACC_RGB},0.06)`, borderWidth: 1,
    borderColor: `rgba(${ACC_RGB},0.15)`, borderRadius: 16,
    padding: 14, marginBottom: 20,
  },
  introIcon: {
    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
    backgroundColor: `rgba(${ACC_RGB},0.1)`, borderWidth: 1,
    borderColor: `rgba(${ACC_RGB},0.2)`, alignItems: 'center', justifyContent: 'center',
  },
  introText: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20, flex: 1 },

  fieldLabel: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 },
  fieldLabelOptional: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 16 },
  charCount: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.25)' },

  typeList: { gap: 6, marginBottom: 4 },
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 12,
  },
  typeRowActive: {
    backgroundColor: `rgba(${ACC_RGB},0.08)`,
    borderColor: `rgba(${ACC_RGB},0.35)`,
  },
  typeRadio: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  typeRadioActive: {
    borderColor: ACC, backgroundColor: ACC,
  },
  typeLabel: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)', flex: 1 },

  textarea: {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Outfit', fontSize: 14, color: '#fff',
    lineHeight: 22, minHeight: 130,
  },

  input: {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: 'Outfit', fontSize: 14, color: '#fff',
  },
  inputNote: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6, lineHeight: 16 },

  errorCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(251,113,133,0.08)', borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.25)', borderRadius: 12,
    padding: 12, marginTop: 12,
  },
  errorText: { fontFamily: 'Outfit', fontSize: 13, color: '#fda4af', lineHeight: 19, flex: 1 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: ACC, borderRadius: 14, paddingVertical: 16,
    marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitText: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: '#060e18' },

  footer: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.15)', textAlign: 'center', marginTop: 24 },

  // Sent state
  sentWrap: { flex: 1, padding: 20, justifyContent: 'center' },
  sentCard: {
    backgroundColor: 'rgba(52,211,153,0.06)', borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)', borderRadius: 20,
    padding: 32, alignItems: 'center',
  },
  sentIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.35)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  sentTitle: { fontFamily: 'Syne', fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.3, marginBottom: 8 },
  sentBody: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20, textAlign: 'center' },
  sentReset: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '700', color: ACC },
});
