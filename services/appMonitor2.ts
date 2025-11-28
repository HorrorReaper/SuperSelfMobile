import { AppState, AppStateStatus, Alert } from 'react-native';
import { generateRandomChallenge } from '../lib/challengeGenerator';
import { MicroChallenge } from '../types';
import { getForegroundApp, checkUsageStatsPermission, startForegroundService } from '../lib/nativeAppMonitor';
import { useAppBlockingStore } from '../stores/appBlockingStores';

class AppMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;
  private currentAppPackage: string | null = null;
  private onBlockedAppDetected: ((appPackage: string, appName: string, challenge: MicroChallenge) => void) | null = null;
  private hasPermission: boolean = false;

  async initialize() {
    this.hasPermission = await checkUsageStatsPermission();
    console.log('📱 Usage stats permission:', this.hasPermission);
    if (this.hasPermission) {
      startForegroundService();
    }
    return this.hasPermission;
  }

  async startMonitoring(
    onDetected: (appPackage: string, appName: string, challenge: MicroChallenge) => void
  ) {
    this.onBlockedAppDetected = onDetected;

    // Check permission first
    if (!this.hasPermission) {
      console.warn('⚠️ No usage stats permission');
      return;
    }

    // Poll every 2 seconds for foreground app
    this.checkInterval = setInterval(async () => {
      await this.checkForegroundApp();
    }, 2000);

    console.log('📱 Native app monitor started');
  }

  private async checkForegroundApp() {
    const { isBlocking, isAppCurrentlyBlocked, getAppByPackage } = useAppBlockingStore.getState();

    // With inverted logic: only check when NOT blocking (apps are blocked by default)
    if (isBlocking) return; // During free time, apps are unblocked, no need to monitor

    try {
      const foregroundApp = await getForegroundApp();

      if (!foregroundApp) return;

      // Ignore our own app
      if (foregroundApp.packageName === 'com.horrorreaper.SuperSelfMobile') {
        this.currentAppPackage = null;
        return;
      }

      // Only trigger if this is a NEW app switch
      if (foregroundApp.packageName !== this.currentAppPackage) {
        this.currentAppPackage = foregroundApp.packageName;

        // Check if this app is blocked
        if (isAppCurrentlyBlocked(foregroundApp.packageName)) {
          const app = getAppByPackage(foregroundApp.packageName);
          const challenge = generateRandomChallenge();

          console.log('🚫 Blocked app detected:', foregroundApp.appName);

          if (this.onBlockedAppDetected && app) {
            this.onBlockedAppDetected(
              foregroundApp.packageName,
              app.appName,
              challenge
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking foreground app:', error);
    }
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.currentAppPackage = null;
    console.log('📱 App monitor stopped');
  }

  // Manual trigger for testing
  simulateBlockedAppOpen(packageName: string) {
    const { getAppByPackage, isAppCurrentlyBlocked, isBlocking } = useAppBlockingStore.getState();

    console.log('[AppMonitor] simulateBlockedAppOpen called for:', packageName);
    console.log('[AppMonitor] isBlocking:', isBlocking);
    console.log('[AppMonitor] isAppCurrentlyBlocked:', isAppCurrentlyBlocked(packageName));

    const app = getAppByPackage(packageName);
    console.log('[AppMonitor] app found:', app);

    if (!app) {
      console.warn('[AppMonitor] App not found in store');
      return;
    }

    if (isBlocking) {
      console.warn('[AppMonitor] Active session running - apps are UNBLOCKED');
      Alert.alert(
        'Apps Currently Unblocked',
        'You have an active free time session. Apps are unblocked right now. Wait for the session to end to test blocking.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isAppCurrentlyBlocked(packageName)) {
      const challenge = generateRandomChallenge();
      console.log('[AppMonitor] Triggering blocked app callback with challenge:', challenge.id);

      if (this.onBlockedAppDetected) {
        this.onBlockedAppDetected(packageName, app.appName, challenge);
      } else {
        console.warn('[AppMonitor] No onBlockedAppDetected callback registered');
        Alert.alert(
          'Blocking Active',
          `${app.appName} is currently blocked. In a real scenario, you would see a challenge when trying to open this app.`,
          [{ text: 'OK' }]
        );
      }
    } else {
      console.warn('[AppMonitor] App is not currently blocked');
      Alert.alert(
        'App Not Blocked',
        `${app.appName} is not in your blocked apps list. Enable it in the settings to test blocking.`,
        [{ text: 'OK' }]
      );
    }
  }
}

export const appMonitor = new AppMonitorService();
