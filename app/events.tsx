import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { UpdatedLine } from '../components/UpdatedLine';
import { eventsData } from '../services/mockData';

const months = ['March', 'April'];

const tagColors: Record<string, string> = {
  Civic: Colors.blueTeal,
  Government: Colors.deepBlue,
  BPU: Colors.green,
  Registration: Colors.blueTeal,
  Community: Colors.amber,
  Environment: Colors.green,
};

export default function EventsScreen() {
  const [activeMonth, setActiveMonth] = useState('March');

  const filtered = eventsData.filter((e) =>
    e.date.startsWith(activeMonth === 'March' ? 'Mar' : 'Apr')
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subhead}>Upcoming in Jamestown</Text>
      </SafeAreaView>

      {/* Month tabs */}
      <View style={styles.tabs}>
        {months.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.tab, activeMonth === m && styles.activeTab]}
            onPress={() => setActiveMonth(m)}
          >
            <Text style={[styles.tabText, activeMonth === m && styles.activeTabText]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title={`${activeMonth} Events`} />
        {filtered.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No events this month yet.</Text>
          </Card>
        ) : (
          filtered.map((event) => (
            <Card key={event.id} style={styles.eventCard}>
              <View style={styles.eventLeft}>
                <Text style={styles.eventDate}>{event.date}</Text>
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
              <View style={styles.eventRight}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color={Colors.gray400} />
                  <Text style={styles.eventLocation}>{event.location}</Text>
                </View>
                <View style={styles.tags}>
                  {event.tags.map((tag) => (
                    <View key={tag} style={[styles.tag, { backgroundColor: (tagColors[tag] || Colors.gray400) + '22' }]}>
                      <Text style={[styles.tagText, { color: tagColors[tag] || Colors.gray600 }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          ))
        )}
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
  tabs: { flexDirection: 'row', backgroundColor: Colors.deepBlue, paddingHorizontal: 16, paddingBottom: 12 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  activeTab: { backgroundColor: Colors.green },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.gray400 },
  activeTabText: { color: Colors.white },
  content: { padding: 16, paddingTop: 20 },
  emptyText: { color: Colors.gray400, fontSize: 14 },
  eventCard: { flexDirection: 'row', gap: 14 },
  eventLeft: { alignItems: 'center', minWidth: 48 },
  eventDate: { fontSize: 13, fontWeight: '800', color: Colors.deepBlue },
  eventTime: { fontSize: 11, color: Colors.gray400, textAlign: 'center', marginTop: 2 },
  eventRight: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: Colors.charcoal, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  eventLocation: { fontSize: 12, color: Colors.gray400 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '600' },
});
