import { Alert, AppState, AppStateStatus } from 'react-native';
import { generateRandomChallenge } from '../lib/challengeGenerator';
import { MicroChallenge } from '../types';
import { useAppBlockingStore } from '../stores/appBlockingStores';

/**
 * AppMonitorService
 *
 * Monitors the device's foreground application and detects when a blocked app
 * becomes active. When a blocked app is detected, the service generates a
 * micro-challenge and invokes a user-provided callback.
 *
 * This implementation uses a periodic polling strategy (every 2 seconds) and a
 * simulated foreground-app detector for development. In production, the
 * getForegroundApp method must be replaced with a native/platform-specific
 * implementation (e.g., accessibility services or native app-usage APIs).
 *
 * Remarks:
 * - The service is designed to be started and stopped via startMonitoring and
 *   stopMonitoring. Only one monitoring interval is active per instance.
 * - Detection only triggers when the foreground package changes from the last
 *   observed package (deduplication by currentAppPackage).
 * - The service depends on an external store (useAppBlockingStore) to:
 *   - determine whether blocking is enabled (isBlocking)
 *   - check whether a specific package is currently blocked (isAppCurrentlyBlocked)
 *   - retrieve metadata for a package (getAppByPackage)
 *
 * Properties (internal):
 * - checkInterval: NodeJS.Timeout | null
 *   Timer handle for the monitoring interval. Cleared by stopMonitoring.
 * - currentAppPackage: string | null
 *   Last observed foreground package name; used to avoid re-triggering for the
 *   same app instance.
 * - onBlockedAppDetected: ((appPackage: string, appName: string, challenge: MicroChallenge) => void) | null
 *   Callback invoked when a blocked app is detected.
 *
 * Methods:
 * - private async getForegroundApp(): Promise<{ packageName: string; appName: string } | null>
 *   Simulated foreground-app detection. Returns an object with packageName and
 *   appName when an external app is considered foreground, otherwise null.
 *   NOTE: This is a development placeholder and must be replaced with a proper
 *   native implementation for reliable production behavior.
 *
 * - startMonitoring(onDetected): void
 *   Starts periodic monitoring (2s interval). The provided onDetected callback
 *   will be invoked with (appPackage, appName, challenge) each time a newly
 *   observed foreground app is found to be blocked. If blocking is currently
 *   disabled via the app blocking store, monitoring still runs but no
 *   detections will be emitted until blocking is enabled.
 *
 *   Parameters:
 *   - onDetected: (appPackage: string, appName: string, challenge: MicroChallenge) => void
 *     Callback invoked when a blocked app is detected.
 *
 * - stopMonitoring(): void
 *   Stops the monitoring interval, clears the timer, and resets internal state
 *   (currentAppPackage). Safe to call multiple times.
 *
 * - simulateBlockedAppOpen(packageName: string): void
 *   Manual/testing helper that triggers the blocked-app detection flow for the
 *   provided package name (if that package is currently marked as blocked by
 *   the store). Generates a challenge and invokes the onBlockedAppDetected
 *   callback if set.
 *
 * Events / Callback contract:
 * - onBlockedAppDetected(appPackage, appName, challenge):
 *   - appPackage: package identifier of the detected app (string)
 *   - appName: human-readable app name (string)
 *   - challenge: MicroChallenge object produced by generateRandomChallenge()
 *
 * Threading / lifecycle notes:
 * - The service uses setInterval and async operations; ensure your runtime
 *   environment supports NodeJS.Timeout semantics or adapt the timer types for
 *   the target platform (e.g., return type differences in browser RN).
 * - Replace the simulated getForegroundApp for accurate foreground detection on
 *   Android/iOS. Consider battery and privacy implications of frequent polling.
 *
 * Example:
 * @example
 * const monitor = new AppMonitorService();
 * monitor.startMonitoring((pkg, name, challenge) => {
 *   // present challenge to user or route to blocking UI
 * });
 * // ... later
 * monitor.stopMonitoring();
 */
class AppMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;
  private currentAppPackage: string | null = null;
  private onBlockedAppDetected: ((appPackage: string, appName: string, challenge: MicroChallenge) => void) | null = null;

  // Simulated foreground app detection
  // In production, this would use native modules or accessibility service
  private async getForegroundApp(): Promise<{ packageName: string; appName: string } | null> {
    // This is a placeholder - actual implementation requires native code
    // For development build, you'd use react-native-app-state or accessibility service
    
    // For now, we'll simulate by checking if user navigates away from our app
    const appState = AppState.currentState;
    
    if (appState === 'background' || appState === 'inactive') {
      // User switched apps - simulate checking a random blocked app
      const blockedApps = useAppBlockingStore.getState().getActiveBlockedApps();
      if (blockedApps.length > 0) {
        const randomApp = blockedApps[Math.floor(Math.random() * blockedApps.length)];
        return {
          packageName: randomApp.packageName,
          appName: randomApp.appName,
        };
      }
    }
    
    return null;
  }

  startMonitoring(
    onDetected: (appPackage: string, appName: string, challenge: MicroChallenge) => void
  ) {
    this.onBlockedAppDetected = onDetected;

    // Check every 2 seconds
    this.checkInterval = setInterval(async () => {
      const { isBlocking, isAppCurrentlyBlocked, getAppByPackage } = useAppBlockingStore.getState();
      
      if (!isBlocking) return;

      const foregroundApp = await this.getForegroundApp();
      
      if (foregroundApp && this.currentAppPackage !== foregroundApp.packageName) {
        this.currentAppPackage = foregroundApp.packageName;

        if (isAppCurrentlyBlocked(foregroundApp.packageName)) {
          const app = getAppByPackage(foregroundApp.packageName);
          const challenge = generateRandomChallenge();
          
          if (this.onBlockedAppDetected && app) {
            this.onBlockedAppDetected(foregroundApp.packageName, app.appName, challenge);
          }
        }
      }
    }, 2000);

    console.log('📱 App monitor started');
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
    const { getAppByPackage, isAppCurrentlyBlocked, getActiveBlockedApps } = useAppBlockingStore.getState();
    Alert.alert('Simulate Block', `Simulating blocked open: ${packageName} in the function`);
    console.log('Simulating blocked app open for package:', packageName);

    // For testing we consider either an active blocking session (isAppCurrentlyBlocked)
    // OR the app being flagged `isBlocked` in the blockedApps list. The latter lets
    // developers validate the full challenge/UI flow without starting a session.
    const flaggedInList = getActiveBlockedApps().some((a) => a.packageName === packageName);
    const blockedBySession = isAppCurrentlyBlocked(packageName);

    console.log('[AppMonitor] flaggedInList:', flaggedInList, 'blockedBySession:', blockedBySession);

    if (blockedBySession || flaggedInList) {
      const app = getAppByPackage(packageName);
      const challenge = generateRandomChallenge();

      // Differentiate the alert so you know whether this was a session block or a test-list block
      if (blockedBySession) {
        Alert.alert('Blocked App Detected', `Blocked app detected (active session): ${packageName}`);
      } else {
        Alert.alert('Blocked App Detected (test)', `App is flagged as blocked in list: ${packageName}`);
      }

      if (this.onBlockedAppDetected && app) {
        this.onBlockedAppDetected(packageName, app.appName, challenge);
      }
    } else {
      Alert.alert('Not Blocked', `App is not blocked: ${packageName}`);
    }
  }
}

export const appMonitor = new AppMonitorService();
