import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { StatusBadge } from '../components/StatusBadge';
import { UpdatedLine } from '../components/UpdatedLine';
import { alertsData } from '../services/mockData';

const severityConfig = {
  info: { color: Colors.blueTeal, icon: 'information-circle-outline' as const, label: 'Info' },
  caution: { color: Colors.amber, icon: 'warning-outline' as const, label: 'Caution' },
  emergency: { color: Colors.red, icon: 'alert-circle-outline' as const, label: 'Emergency' },
};

export default function AlertsScreen() {
  const isClear = alertsData.status === 'clear';
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subhead}>Jamestown advisories and updates</Text>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status card */}
        <Card variant={isClear ? 'default' : 'dark'} style={[styles.statusCard, isClear && styles.statusClear]}>
          <Ionicons
            name={isClear ? 'checkmark-circle' : 'alert-circle'}
            size={32}
            color={isClear ? Colors.green : Colors.red}
          />
          <Text style={[styles.statusText, { color: isClear ? Colors.green : Colors.red }]}>
            {isClear ? 'All Clear' : 'Active Alert'}
          </Text>
          <Text style={styles.statusMessage}>{alertsData.message}</Text>
          <StatusBadge label={isClear ? 'No active alerts' : 'Alert active'} severity={isClear ? 'green' : 'red'} />
        </Card>

        {/* Recent updates */}
        <SectionHeader title="Recent Updates" />
        {alertsData.updates.map((update) => {
          const config = severityConfig[update.severity as keyof typeof severityConfig] || severityConfig.info;
          return (
            <Card key={update.id} style={styles.updateCard}>
              <View style={styles.updateHeader}>
                <Ionicons name={config.icon} size={18} color={config.color} />
                <Text style={[styles.updateDate, { color: config.color }]}>{update.date}</Text>
                <StatusBadge label={config.label} severity={update.severity === 'caution' ? 'amber' : 'blue'} />
              </View>
              <Text style={styles.updateTitle}>{update.title}</Text>
              <Text style={styles.updateBody}>{update.body}</Text>
            </Card>
          );
        })}

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
  statusCard: { alignItems: 'center', paddingVertical: 32, gap: 10, marginBottom: 16 },
  statusClear: { borderWidth: 1, borderColor: Colors.green + '30' },
  statusText: { fontSize: 22, fontWeight: '800' },
  statusMessage: { fontSize: 14, color: Colors.gray600, textAlign: 'center' },
  updateCard: { marginBottom: 10 },
  updateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  updateDate: { flex: 1, fontSize: 12, fontWeight: '600' },
  updateTitle: { fontSize: 15, fontWeight: '700', color: Colors.charcoal, marginBottom: 4 },
  updateBody: { fontSize: 13, color: Colors.gray600, lineHeight: 19 },
});
