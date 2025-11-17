import { NativeModules, Platform } from 'react-native';

interface AppInfo {
  packageName: string;
  appName: string;
}

interface AppMonitorModule {
  getForegroundApp(): Promise<AppInfo | null>;
  hasUsageStatsPermission(): Promise<boolean>;
  openUsageStatsSettings(): Promise<boolean>;
}

const LINKING_ERROR =
  `The package 'AppMonitor' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const native = NativeModules.AppMonitor;

// If the native module is not available (e.g., running in Expo Go), provide
// a safe JS fallback that logs warnings and returns sensible defaults. This
// allows the app to run in development without crashing while making it
// explicit that full blocking behavior requires a native build.
const AppMonitor: AppMonitorModule = native
  ? native
  : {
      async getForegroundApp() {
        console.warn('[nativeAppMonitor] AppMonitor native module not linked: getForegroundApp unavailable');
        return null;
      },
      async hasUsageStatsPermission() {
        console.warn('[nativeAppMonitor] AppMonitor native module not linked: hasUsageStatsPermission -> false');
        return false;
      },
      async openUsageStatsSettings() {
        console.warn('[nativeAppMonitor] AppMonitor native module not linked: openUsageStatsSettings -> false');
        return false;
      },
    };

export default AppMonitor;

// Convenience functions
export async function getForegroundApp(): Promise<AppInfo | null> {
  if (Platform.OS !== 'android') {
    console.warn('AppMonitor is only available on Android');
    return null;
  }

  try {
    return await AppMonitor.getForegroundApp();
  } catch (error) {
    console.error('Failed to get foreground app:', error);
    return null;
  }
}

export async function checkUsageStatsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await AppMonitor.hasUsageStatsPermission();
  } catch (error) {
    console.error('Failed to check permission:', error);
    return false;
  }
}

export async function requestUsageStatsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await AppMonitor.openUsageStatsSettings();
  } catch (error) {
    console.error('Failed to open settings:', error);
    return false;
  }
}
