import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function DatesScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text accessibilityRole="header" style={styles.header}>
        Dates
      </Text>
      <View style={styles.empty}>
        <Text style={styles.icon}>🗓️</Text>
        <Text style={styles.title}>Make room for important days</Text>
        <Text style={styles.description}>
          Birthdays, anniversaries, and meetings will live here.
        </Text>
        <Text style={styles.soon}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 24 },
  header: { fontSize: 28, fontWeight: '700', color: '#1e293b', marginTop: 20 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  icon: { fontSize: 46, marginBottom: 20 },
  title: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
  },
  soon: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 20,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
});
