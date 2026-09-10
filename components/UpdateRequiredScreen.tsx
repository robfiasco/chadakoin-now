import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dark } from '../lib/colors';
import { openLink } from '../lib/openLink';

const ICON = require('../assets/files/icon-chadakoin.png');
const ACC = dark.category.city; // cyan — matches the app's primary-CTA color elsewhere

export function UpdateRequiredScreen({ storeUrl }: { storeUrl: string | null }) {
  return (
    <View style={styles.container}>
      <Image source={ICON} style={styles.icon} resizeMode="contain" />
      <Text style={styles.title}>Update Required</Text>
      <Text style={styles.body}>
        This version of Chadakoin Now is out of date. Update to keep getting live recycling,
        events, alerts, and news for Jamestown.
      </Text>
      {storeUrl ? (
        <TouchableOpacity onPress={() => openLink(storeUrl)} activeOpacity={0.85} style={styles.button}>
          <Text style={styles.buttonText}>Update Now</Text>
          <Ionicons name="arrow-forward" size={16} color="#000" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Syne',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  body: {
    fontFamily: 'Outfit',
    fontSize: 14,
    lineHeight: 21,
    color: dark.text.muted,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: ACC,
  },
  buttonText: {
    fontFamily: 'Syne',
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
});
