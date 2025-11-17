import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppBlockingStore } from '../stores/appBlockingStores';
import { appMonitor } from '../services/appMonitor2';
import { checkUsageStatsPermission } from '../lib/nativeAppMonitor';
import PermissionRequest from '../components/PermissionRequest';

export default function BlockingSettingsScreen() {
  const router = useRouter();
  const { blockedApps, initializeBlocking, toggleAppBlock } = useAppBlockingStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await checkUsageStatsPermission();
    setHasPermission(granted);
    setPermissionChecked(true);

    if (granted) {
      await appMonitor.initialize();
    }
  };

  if (!permissionChecked) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (!hasPermission) {
    return <PermissionRequest onPermissionGranted={() => setHasPermission(true)} />;
  }

  useEffect(() => {
    initializeBlocking();
  }, []); // Initialisiere die Blockierungseinstellungen beim Laden des Bildschirms

  // Render-time debug log to quickly inspect store state when the screen renders
  console.log('[BlockingSettings] render blockedApps ->', blockedApps.map(a => ({ packageName: a.packageName, isBlocked: a.isBlocked })));

  const getActiveBlockedApps = () => {
    return blockedApps.filter((app) => app.isBlocked);
  }

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

        {/* Debug: show store contents so you can confirm which apps are currently flagged blocked */}
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>Debug store (blockedApps)</Text>
          <Text style={styles.debugText}>{JSON.stringify(blockedApps, null, 2)}</Text>
        </View>

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

<View style={styles.testSection}>
  <Text style={styles.sectionTitle}>Test Blocking System</Text>
  
  {getActiveBlockedApps().map((app) => (
    <TouchableOpacity
      key={app.packageName}
      style={styles.testButton}
      onPress={() => {
        Alert.alert('Simulate Block', `Simulating blocked open: ${app.appName}`);
        appMonitor.simulateBlockedAppOpen(app.packageName);
      }}
    >
      <Text style={styles.testButtonText}>Test Block: {app.appName}</Text>
    </TouchableOpacity>
  ))}
</View>
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
  debugBox: {
    backgroundColor: '#0f0f12',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  debugTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
  },
  debugText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  testSection: {
  marginTop: 24,
  paddingTop: 24,
  borderTopWidth: 1,
  borderTopColor: '#2a2a2a',
},
testButton: {
  backgroundColor: '#2196F3',
  padding: 14,
  borderRadius: 10,
  alignItems: 'center',
  marginBottom: 10,
},
testButtonText: {
  color: '#fff',
  fontSize: 15,
  fontWeight: '600',
},
});
