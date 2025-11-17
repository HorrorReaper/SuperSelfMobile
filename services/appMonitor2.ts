import { AppState, AppStateStatus } from 'react-native';
import { generateRandomChallenge } from '../lib/challengeGenerator';
import { MicroChallenge } from '../types';
import { getForegroundApp, checkUsageStatsPermission } from '../lib/nativeAppMonitor';
import { useAppBlockingStore } from '../stores/appBlockingStores';

class AppMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;
  private currentAppPackage: string | null = null;
  private onBlockedAppDetected: ((appPackage: string, appName: string, challenge: MicroChallenge) => void) | null = null;
  private hasPermission: boolean = false;

  async initialize() {
    this.hasPermission = await checkUsageStatsPermission();
    console.log('📱 Usage stats permission:', this.hasPermission);
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
    
    if (!isBlocking) return;

    try {
      const foregroundApp = await getForegroundApp();
      
      if (!foregroundApp) return;

      // Ignore our own app
      if (foregroundApp.packageName === 'com.superself.app') {
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
    const { getAppByPackage, isAppCurrentlyBlocked } = useAppBlockingStore.getState();
    
    if (isAppCurrentlyBlocked(packageName)) {
      const app = getAppByPackage(packageName);
      const challenge = generateRandomChallenge();
      
      if (this.onBlockedAppDetected && app) {
        this.onBlockedAppDetected(packageName, app.appName, challenge);
      }
    }
  }
}

export const appMonitor = new AppMonitorService();
