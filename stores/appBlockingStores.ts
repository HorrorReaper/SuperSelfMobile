import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockedApp, BlockingSession, AppUnlock, ChallengeAttempt } from '../types';

interface AppBlockingStore {
  blockedApps: BlockedApp[];
  currentSession: BlockingSession | null;
  isBlocking: boolean;
  attemptHistory: ChallengeAttempt[];
  
  // Existing methods
  initializeBlocking: () => Promise<void>;
  addBlockedApp: (app: BlockedApp) => Promise<void>;
  removeBlockedApp: (packageName: string) => Promise<void>;
  toggleAppBlock: (packageName: string) => Promise<void>;
  startBlockingSession: (durationMinutes: number, xpCost: number) => Promise<void>;
  endBlockingSession: () => Promise<void>;
  getActiveBlockedApps: () => BlockedApp[];
  
  // New methods for challenge system
  isAppCurrentlyBlocked: (packageName: string) => boolean;
  recordChallengeAttempt: (attempt: ChallengeAttempt) => Promise<void>;
  unlockApp: (packageName: string, challengeId: string, tempMinutes?: number) => Promise<void>;
  recordViolation: () => Promise<void>;
  recordSuccess: () => Promise<void>;
  getAppByPackage: (packageName: string) => BlockedApp | undefined;
  
  save: () => Promise<void>;
}

const COMMON_SOCIAL_APPS: BlockedApp[] = [
  { packageName: 'com.instagram.android', appName: 'Instagram', isBlocked: true },
  { packageName: 'com.twitter.android', appName: 'Twitter/X', isBlocked: true },
  { packageName: 'com.facebook.katana', appName: 'Facebook', isBlocked: true },
  { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', isBlocked: true },
  { packageName: 'com.snapchat.android', appName: 'Snapchat', isBlocked: true },
  { packageName: 'com.reddit.frontpage', appName: 'Reddit', isBlocked: true },
  { packageName: 'com.google.android.youtube', appName: 'YouTube', isBlocked: false },
  { packageName: 'com.whatsapp', appName: 'WhatsApp', isBlocked: false },
  { packageName: 'com.discord', appName: 'Discord', isBlocked: false },
  { packageName: 'com.netflix.mediaclient', appName: 'Netflix', isBlocked: false },
];

/**
 * Zustand store managing app-blocking sessions, blocked app list, and related metrics.
 *
 * This store encapsulates in-memory state and persistence (via AsyncStorage) for a
 * single active blocking session and the global list of apps that can be blocked.
 *
 * State shape
 * - blockedApps: BlockedApp[] — list of known apps with per-app `isBlocked` flag.
 * - currentSession: BlockingSession | null — the currently active blocking session, or null.
 * - isBlocking: boolean — whether a blocking session is currently active.
 * - attemptHistory: ChallengeAttempt[] — chronological history of challenge attempts.
 *
 * Persistence keys (AsyncStorage)
 * - 'blockedApps'       — persisted blockedApps array
 * - 'currentSession'    — persisted currentSession (kept in sync while session is active)
 * - 'attemptHistory'    — persisted attemptHistory array
 * - 'sessionHistory'    — archive of completed sessions appended on session end
 *
 * Concurrency & consistency
 * - Most mutating methods are async and update the Zustand state via set(...),
 *   then persist to AsyncStorage. The implementation commonly uses get() after set()
 *   to obtain the latest state for persistence.
 * - initializeBlocking loads persisted data and restores a valid session if its endTime
 *   is in the future. It also prunes expired temporary unlocks from the restored session.
 * - Errors during initialization or saving are caught and logged to console.
 *
 * Public methods
 *
 * initializeBlocking(): Promise<void>
 * - Loads persisted blockedApps, currentSession, and attemptHistory from AsyncStorage.
 * - Restores an active session only if its endTime is in the future; otherwise calls
 *   endBlockingSession to finalize/cleanup expired session data.
 * - Prunes expired app unlocks when restoring a session so only valid temporary unlocks remain.
 * - Side effects: may set state (blockedApps, currentSession, isBlocking, attemptHistory).
 *
 * addBlockedApp(app: BlockedApp): Promise<void>
 * - Adds the provided BlockedApp to blockedApps.
 * - Persists blockedApps via save().
 *
 * removeBlockedApp(packageName: string): Promise<void>
 * - Removes any BlockedApp whose packageName matches the provided string.
 * - Persists blockedApps via save().
 *
 * toggleAppBlock(packageName: string): Promise<void>
 * - Toggles the isBlocked flag for the app with the given packageName.
 * - Persists blockedApps via save().
 *
 * startBlockingSession(durationMinutes: number, xpCost: number): Promise<void>
 * - Creates and activates a new BlockingSession starting at now and ending after durationMinutes.
 * - The session includes the list of package names for apps currently marked isBlocked.
 * - Initializes session metrics (violations, successfulChallenges, failedChallenges) and unlocks array.
 * - Persists the created session to 'currentSession' in AsyncStorage.
 * - Side effects: sets currentSession and isBlocking = true.
 *
 * endBlockingSession(): Promise<void>
 * - Marks the currentSession as completed (if present), appends it to archived 'sessionHistory'
 *   in AsyncStorage, clears currentSession, sets isBlocking = false, and removes 'currentSession'
 *   from AsyncStorage.
 * - If no currentSession exists, this clears isBlocking and ensures current session storage is removed.
 *
 * isAppCurrentlyBlocked(packageName: string): boolean
 * - Synchronously checks whether the given packageName is currently blocked by the active session.
 * - Returns false if there is no active session or isBlocking is false.
 * - Returns false if the app is not included in currentSession.blockedApps.
 * - Returns false if there exists a valid (non-expired) unlock for that package in currentSession.unlocks.
 * - Otherwise returns true (the app is blocked).
 *
 * recordChallengeAttempt(attempt: ChallengeAttempt): Promise<void>
 * - Appends a ChallengeAttempt to attemptHistory and persists the updated history to AsyncStorage.
 *
 * unlockApp(packageName: string, challengeId: string, tempMinutes = 5): Promise<void>
 * - Grants a temporary unlock for the specified packageName tied to a completed challengeId.
 * - The unlock expires after tempMinutes minutes (default 5).
 * - Replaces any existing unlock for the same packageName in the currentSession.unlocks array.
 * - Persists the updated currentSession to AsyncStorage when a currentSession exists.
 *
 * recordViolation(): Promise<void>
 * - Increments the currentSession's violations and failedChallenges counters by 1.
 * - Persists the updated currentSession to AsyncStorage when a currentSession exists.
 *
 * recordSuccess(): Promise<void>
 * - Increments the currentSession's successfulChallenges counter by 1.
 * - Persists the updated currentSession to AsyncStorage when a currentSession exists.
 *
 * getActiveBlockedApps(): BlockedApp[]
 * - Returns the list of BlockedApp entries with isBlocked === true from the in-memory blockedApps.
 * - Synchronous selector convenience helper.
 *
 * getAppByPackage(packageName: string): BlockedApp | undefined
 * - Returns the BlockedApp entry matching the provided packageName, or undefined if not found.
 *
 * save(): Promise<void>
 * - Persists the in-memory blockedApps array to AsyncStorage under 'blockedApps'.
 * - Errors during save are caught and logged to console.
 *
 * Types (referenced but not defined here)
 * - BlockedApp: 
 * - BlockingSession: {
 *     id: string;
 *     startTime: string; // ISO timestamp
 *     endTime: string;   // ISO timestamp
 *     durationMinutes: number;
 *     xpCost: number;
 *     blockedApps: string[]; // package names
 *     violations: number;
 *     successfulChallenges: number;
 *     failedChallenges: number;
 *     completed: boolean;
 *     unlocks: AppUnlock[];
 *   }
 * - AppUnlock: { packageName: string; unlockedAt: string; expiresAt: string; challengeCompleted: string; }
 * - ChallengeAttempt: { /* shape of an individual attempt record 
 *
 * Notes & recommendations
 * - All time comparisons are performed using Date and ISO strings; ensure device clock correctness
 *   for reliable expiration semantics.
 * - Consumers should await async methods before assuming persistence is complete.
 * - initializeBlocking should be invoked at app startup to restore persisted state.
 *
 * @remarks
 * This store is intended to be the single source of truth for app blocking behavior in the app.
 * It manages both UI-visible state (e.g., which apps are blocked) and session lifecycle, and
 * provides helper methods to mutate state while keeping AsyncStorage synchronized.
 */
export const useAppBlockingStore = create<AppBlockingStore>((set, get) => ({
  blockedApps: COMMON_SOCIAL_APPS,
  currentSession: null,
  isBlocking: false,
  attemptHistory: [],

  initializeBlocking: async () => {
    console.log('[AppStore] initializeBlocking START');
    try {
      const stored = await AsyncStorage.getItem('blockedApps');
      console.log('[AppStore] Loaded blocked apps from storage raw:', stored);
      if (stored) {
        const apps: BlockedApp[] = JSON.parse(stored);
        set({ blockedApps: apps });
        console.log('[AppStore] Restored blockedApps length:', apps.length);
      }

      const sessionStored = await AsyncStorage.getItem('currentSession');
      if (sessionStored) {
        const session: BlockingSession = JSON.parse(sessionStored);
        const endTime = new Date(session.endTime);
        console.log('[AppStore] Found persisted session id:', session.id, 'endTime:', session.endTime);
        
        if (endTime > new Date()) {
          // Clean up expired unlocks
          const validUnlocks = session.unlocks.filter(
            unlock => new Date(unlock.expiresAt) > new Date()
          );
          
          set({
            currentSession: { ...session, unlocks: validUnlocks },
            isBlocking: true,
          });
          console.log('[AppStore] Restored active session with valid unlocks count:', validUnlocks.length);
        } else {
          console.log('[AppStore] Persisted session expired, ending it');
          await get().endBlockingSession();
        }
      }

      const historyStored = await AsyncStorage.getItem('attemptHistory');
      if (historyStored) {
        set({ attemptHistory: JSON.parse(historyStored) });
        console.log('[AppStore] Restored attemptHistory length:', get().attemptHistory.length);
      }
    } catch (error) {
      console.error('[AppStore] Failed to load blocking settings:', error);
    }
    console.log('[AppStore] initializeBlocking END');
  },

  addBlockedApp: async (app: BlockedApp) => {
    console.log('[AppStore] addBlockedApp', app.packageName);
    set((state) => ({
      blockedApps: [...state.blockedApps, app],
    }));
    await get().save();
  },

  removeBlockedApp: async (packageName: string) => {
    console.log('[AppStore] removeBlockedApp', packageName);
    set((state) => ({
      blockedApps: state.blockedApps.filter((app) => app.packageName !== packageName),
    }));
    await get().save();
  },

  toggleAppBlock: async (packageName: string) => {
    console.log('[AppStore] toggleAppBlock called for', packageName);
    set((state) => ({
      blockedApps: state.blockedApps.map((app) =>
        app.packageName === packageName
          ? { ...app, isBlocked: !app.isBlocked }
          : app
      ),
    }));
    console.log('[AppStore] toggleAppBlock new blockedApps count:', get().blockedApps.length);
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
      successfulChallenges: 0,
      failedChallenges: 0,
      completed: false,
      unlocks: [],
    };

    console.log('[AppStore] startBlockingSession created session', session.id, 'duration:', durationMinutes);
    set({ currentSession: session, isBlocking: true });
    await AsyncStorage.setItem('currentSession', JSON.stringify(session));
  },

  endBlockingSession: async () => {
    const { currentSession } = get();
    console.log('[AppStore] endBlockingSession called. currentSession:', currentSession ? currentSession.id : 'none');
    
    if (currentSession) {
      const completedSession = {
        ...currentSession,
        completed: true,
      };
      
      const history = await AsyncStorage.getItem('sessionHistory');
      const sessions = history ? JSON.parse(history) : [];
      sessions.push(completedSession);
      await AsyncStorage.setItem('sessionHistory', JSON.stringify(sessions));
      console.log('[AppStore] Archived session id:', currentSession.id);
    }

    set({ currentSession: null, isBlocking: false });
    await AsyncStorage.removeItem('currentSession');
  },

  isAppCurrentlyBlocked: (packageName: string): boolean => {
    const { currentSession, isBlocking } = get();
    console.log('[AppStore] isAppCurrentlyBlocked check for', packageName, 'isBlocking:', isBlocking);
    
    if (!isBlocking || !currentSession) {
      console.log('[AppStore] isAppCurrentlyBlocked -> false (no active session)');
      return false;
    }
    
    // Check if app is in blocked list
    if (!currentSession.blockedApps.includes(packageName)) {
      console.log('[AppStore] isAppCurrentlyBlocked -> false (not in session.blockedApps)');
      return false;
    }
    
    // Check if app has valid unlock
    const unlock = currentSession.unlocks.find(
      (u) => u.packageName === packageName && new Date(u.expiresAt) > new Date()
    );
    
    const blocked = !unlock; // Blocked if no valid unlock exists
    console.log('[AppStore] isAppCurrentlyBlocked ->', blocked, 'unlock:', unlock);
    return blocked;
  },

  recordChallengeAttempt: async (attempt: ChallengeAttempt) => {
    console.log('[AppStore] recordChallengeAttempt', attempt);
    set((state) => ({
      attemptHistory: [...state.attemptHistory, attempt],
    }));
    
    await AsyncStorage.setItem('attemptHistory', JSON.stringify(get().attemptHistory));
  },

  unlockApp: async (packageName: string, challengeId: string, tempMinutes = 5) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + tempMinutes * 60000);

    const unlock: AppUnlock = {
      packageName,
      unlockedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      challengeCompleted: challengeId,
    };

    console.log('[AppStore] unlockApp', packageName, 'challengeId:', challengeId, 'expiresAt:', expiresAt.toISOString());
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            unlocks: [
              ...state.currentSession.unlocks.filter((u) => u.packageName !== packageName),
              unlock,
            ],
          }
        : null,
    }));

    const { currentSession } = get();
    if (currentSession) {
      await AsyncStorage.setItem('currentSession', JSON.stringify(currentSession));
      console.log('[AppStore] unlockApp persisted currentSession id:', currentSession.id);
    }
  },

  recordViolation: async () => {
    console.log('[AppStore] recordViolation called');
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            violations: state.currentSession.violations + 1,
            failedChallenges: state.currentSession.failedChallenges + 1,
          }
        : null,
    }));

    const { currentSession } = get();
    if (currentSession) {
      await AsyncStorage.setItem('currentSession', JSON.stringify(currentSession));
      console.log('[AppStore] recordViolation updated session:', currentSession.id, 'violations:', currentSession.violations);
    }
  },

  recordSuccess: async () => {
    console.log('[AppStore] recordSuccess called');
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            successfulChallenges: state.currentSession.successfulChallenges + 1,
          }
        : null,
    }));

    const { currentSession } = get();
    if (currentSession) {
      await AsyncStorage.setItem('currentSession', JSON.stringify(currentSession));
      console.log('[AppStore] recordSuccess updated session:', currentSession.id, 'successfulChallenges:', currentSession.successfulChallenges);
    }
  },

  getActiveBlockedApps: () => {
    const active = get().blockedApps.filter((app) => app.isBlocked);
    console.log('[AppStore] getActiveBlockedApps -> count:', active.length, active.map(a=>a.packageName));
    return active;
  },

  getAppByPackage: (packageName: string) => {
    return get().blockedApps.find((app) => app.packageName === packageName);
  },

  save: async () => {
    try {
      console.log('[AppStore] save called. saving blockedApps length:', get().blockedApps.length);
      await AsyncStorage.setItem('blockedApps', JSON.stringify(get().blockedApps));
    } catch (error) {
      console.error('[AppStore] Failed to save blocked apps:', error);
    }
  },
}));
