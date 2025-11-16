import { Stack, useRouter } from 'expo-router';
import { useAppBlockingStore } from '../stores/appBlockingStores';
import { useEffect } from 'react';
import { appMonitor } from '../services/appMonitor';
import { MicroChallenge } from '../types';

export default function RootLayout() {
  const router = useRouter();
  const { isBlocking, initializeBlocking } = useAppBlockingStore();

  useEffect(() => {
    initializeBlocking();
  }, []);

  useEffect(() => {
    // Start the monitor once on mount and register the callback so
    // simulateBlockedAppOpen can invoke the same callback during testing.
    appMonitor.startMonitoring((packageName: string, appName: string, challenge: MicroChallenge) => {
      // Navigate to blocking overlay with challenge
      router.push({
        pathname: '/blocking-overlay',
        params: {
          packageName,
          appName,
          challenge: JSON.stringify(challenge),
        },
      });
    });

    return () => {
      appMonitor.stopMonitoring();
    };
  }, []);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="plan" />
      <Stack.Screen name="reflect" />
      <Stack.Screen name="redeem" />
      <Stack.Screen name="challenge" />
      <Stack.Screen name="blocking-settings" />
       <Stack.Screen
        name="blocking-overlay"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />

      <Stack.Screen name="stats" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
