import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { UpdatedLine } from '../components/UpdatedLine';
import { recyclingData } from '../services/mockData';

export default function RecyclingScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Recycling</Text>
        <Text style={styles.subhead}>Jamestown pickup schedule</Text>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="This Week" />
        <Card variant="primary" style={styles.heroCard}>
          <Text style={styles.weekLabel}>{recyclingData.thisWeek.dateRange}</Text>
          {recyclingData.thisWeek.items.map((item) => (
            <View key={item} style={styles.itemRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </Card>

        <SectionHeader title="Next Week" />
        <Card style={styles.nextCard}>
          <Text style={styles.nextWeekLabel}>{recyclingData.nextWeek.dateRange}</Text>
          {recyclingData.nextWeek.items.map((item) => (
            <View key={item} style={styles.itemRowLight}>
              <Ionicons name="ellipse-outline" size={14} color={Colors.gray400} />
              <Text style={styles.itemTextLight}>{item}</Text>
            </View>
          ))}
        </Card>

        <SectionHeader title="Holiday Rule" />
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.blueTeal} />
          <Text style={styles.infoText}>{recyclingData.holidayRule}</Text>
        </Card>

        <SectionHeader title="Rotation" />
        {recyclingData.rotation.map((r, i) => (
          <Card key={i}>
            <Text style={styles.rotationText}>{r}</Text>
          </Card>
        ))}

        <UpdatedLine text="Updated today · 6:00 AM" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { backgroundColor: Colors.deepBlue, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  subhead: { fontSize: 13, color: Colors.gray400, marginTop: 2 },
  content: { padding: 16, paddingTop: 20 },
  heroCard: {},
  weekLabel: { fontSize: 12, color: Colors.green, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  itemText: { fontSize: 18, fontWeight: '700', color: Colors.cream },
  nextCard: {},
  nextWeekLabel: { fontSize: 12, color: Colors.gray400, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  itemRowLight: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  itemTextLight: { fontSize: 15, color: Colors.charcoal },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontSize: 14, color: Colors.gray600, lineHeight: 20 },
  rotationText: { fontSize: 14, color: Colors.charcoal },
});
