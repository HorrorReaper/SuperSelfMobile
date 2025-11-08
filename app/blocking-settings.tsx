import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppBlockingStore } from '../stores/appBlockingStores';

export default function BlockingSettingsScreen() {
  const router = useRouter();
  const { blockedApps, initializeBlocking, toggleAppBlock } = useAppBlockingStore();

  useEffect(() => {
    initializeBlocking();
  }, []); // Initialisiere die Blockierungseinstellungen beim Laden des Bildschirms

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>App Blocking</Text>
        <Text style={styles.subtitle}>
          Select which apps to block during redemption sessions
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🚫 How it works</Text>
          <Text style={styles.infoText}>
            • Selected apps will be blocked when you redeem screen time{'\n'}
            • A warning appears if you try to open blocked apps{'\n'}
            • Violations are tracked but won't end your session{'\n'}
            • Stay disciplined and honor your commitment
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Apps to Block</Text>

        {blockedApps.map((app) => (
          <View key={app.packageName} style={styles.appCard}>
            <View style={styles.appInfo}>
              <Text style={styles.appIcon}>📱</Text>
              <Text style={styles.appName}>{app.appName}</Text>
            </View>
            <Switch
              value={app.isBlocked}
              onValueChange={() => toggleAppBlock(app.packageName)}
              trackColor={{ false: '#2a2a2a', true: '#4CAF50' }}
              thumbColor={app.isBlocked ? '#fff' : '#666'}
            />
          </View>
        ))}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Pro Tip</Text>
          <Text style={styles.tipText}>
            Start by blocking your most addictive apps. You can always adjust
            this list based on your triggers.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  backText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  appName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  tipCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
});
