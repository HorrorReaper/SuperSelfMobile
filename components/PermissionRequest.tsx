import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { checkUsageStatsPermission, requestUsageStatsPermission } from '../lib/nativeAppMonitor';

interface PermissionRequestProps {
  onPermissionGranted: () => void;
}

export default function PermissionRequest({ onPermissionGranted }: PermissionRequestProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setChecking(true);
    const granted = await checkUsageStatsPermission();
    setHasPermission(granted);
    setChecking(false);

    if (granted) {
      onPermissionGranted();
    }
  };

  const handleRequestPermission = async () => {
    Alert.alert(
      'Enable Usage Access',
      'To monitor app usage, you need to grant "Usage Access" permission.\n\n' +
      '1. Tap "Open Settings"\n' +
      '2. Find "SuperSelf" in the list\n' +
      '3. Toggle the switch ON\n' +
      '4. Come back to this app',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: async () => {
            await requestUsageStatsPermission();
            // Give user time to grant permission
            setTimeout(() => {
              checkPermission();
            }, 2000);
          },
        },
      ]
    );
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Checking permissions...</Text>
      </View>
    );
  }

  if (hasPermission) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Permission Required</Text>
      <Text style={styles.description}>
        To block apps effectively, SuperSelf needs permission to monitor which apps are running.
      </Text>
      <Text style={styles.note}>
        This permission is used ONLY to detect when you open blocked apps during a focus session.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
        <Text style={styles.buttonText}>Grant Permission</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.recheckButton} onPress={checkPermission}>
        <Text style={styles.recheckText}>I've Already Granted It</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000',
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  recheckButton: {
    padding: 12,
  },
  recheckText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  text:{ color: '#fff' },
});
