import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockedApp, BlockingSession } from '../types';

interface AppBlockingStore {
  blockedApps: BlockedApp[];
  currentSession: BlockingSession | null;
  isBlocking: boolean;
  
  initializeBlocking: () => Promise<void>;
  addBlockedApp: (app: BlockedApp) => Promise<void>;
  removeBlockedApp: (packageName: string) => Promise<void>;
  toggleAppBlock: (packageName: string) => Promise<void>;
  startBlockingSession: (durationMinutes: number, xpCost: number) => Promise<void>;
  endBlockingSession: () => Promise<void>;
  recordViolation: () => void;
  getActiveBlockedApps: () => BlockedApp[];
  save: () => Promise<void>;
} //Store für die Verwaltung blockierter Apps und Blocking Sessions

const COMMON_SOCIAL_APPS: BlockedApp[] = [
  { packageName: 'com.instagram.android', appName: 'Instagram', isBlocked: true },
  { packageName: 'com.twitter.android', appName: 'Twitter/X', isBlocked: true },
  { packageName: 'com.facebook.katana', appName: 'Facebook', isBlocked: true },
  { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', isBlocked: true },
  { packageName: 'com.snapchat.android', appName: 'Snapchat', isBlocked: true },
  { packageName: 'com.reddit.frontpage', appName: 'Reddit', isBlocked: true },
  { packageName: 'com.google.android.youtube', appName: 'YouTube', isBlocked: false },
  { packageName: 'com.whatsapp', appName: 'WhatsApp', isBlocked: false },
]; //Vordefinierte Liste gängiger sozialer Apps

export const useAppBlockingStore = create<AppBlockingStore>((set, get) => ({
  blockedApps: COMMON_SOCIAL_APPS,
  currentSession: null,
  isBlocking: false,

  initializeBlocking: async () => {
    try {
      const stored = await AsyncStorage.getItem('blockedApps');
      if (stored) {
        const apps: BlockedApp[] = JSON.parse(stored);
        set({ blockedApps: apps });
      } // wenn gespeicherte blockierte Apps vorhanden sind, lade sie

      // Check if there's an active session
      const sessionStored = await AsyncStorage.getItem('currentSession');
      if (sessionStored) {
        const session: BlockingSession = JSON.parse(sessionStored);
        const endTime = new Date(session.endTime);
        
        if (endTime > new Date()) {
          set({ currentSession: session, isBlocking: true });
        } else {
          // Session expired
          await get().endBlockingSession();
        }
      }
    } catch (error) {
      console.error('Failed to load blocking settings:', error);
    }
  },

  addBlockedApp: async (app: BlockedApp) => {
    set((state) => ({
      blockedApps: [...state.blockedApps, app],
    })); // Neue blockierte App hinzufügen
    await get().save();
  },

  removeBlockedApp: async (packageName: string) => {
    set((state) => ({
      blockedApps: state.blockedApps.filter((app) => app.packageName !== packageName),
    })); // Blockierte App entfernen
    await get().save();
  },

  toggleAppBlock: async (packageName: string) => {
    set((state) => ({
      blockedApps: state.blockedApps.map((app) =>
        app.packageName === packageName
          ? { ...app, isBlocked: !app.isBlocked }
          : app
      ),
    })); // Blockierungsstatus der App umschalten zwischen blockiert und nicht blockiert
    await get().save();
  },

  startBlockingSession: async (durationMinutes: number, xpCost: number) => {
    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60000);

    const session: BlockingSession = {
      id: `session_${Date.now()}`,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes,
      xpCost,
      blockedApps: get().blockedApps
        .filter((app) => app.isBlocked)
        .map((app) => app.packageName),
      violations: 0,
      completed: false,
    }; // Neue Blocking Session erstellen

    set({ currentSession: session, isBlocking: true });
    await AsyncStorage.setItem('currentSession', JSON.stringify(session));
  },

  endBlockingSession: async () => {
    const { currentSession } = get();
    
    if (currentSession) {
      const completedSession = {
        ...currentSession,
        completed: true,
      };
      
      // Save to history
      const history = await AsyncStorage.getItem('sessionHistory');
      const sessions = history ? JSON.parse(history) : [];
      sessions.push(completedSession);
      await AsyncStorage.setItem('sessionHistory', JSON.stringify(sessions));
    } // Blocking Session beenden und in der Historie speichern

    set({ currentSession: null, isBlocking: false });
    await AsyncStorage.removeItem('currentSession');
  },

  recordViolation: () => {
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, violations: state.currentSession.violations + 1 }
        : null,
    }));
  }, // Verstoß in der aktuellen Session aufzeichnen

  getActiveBlockedApps: () => {
    return get().blockedApps.filter((app) => app.isBlocked);
  }, // Liste der aktuell blockierten Apps zurückgeben

  save: async () => {
    try {
      await AsyncStorage.setItem('blockedApps', JSON.stringify(get().blockedApps));
    } catch (error) {
      console.error('Failed to save blocked apps:', error);
    }
  },
}));
