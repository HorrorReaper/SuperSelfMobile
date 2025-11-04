import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyChallenge, ChallengeProgress } from '../types';
import { CHALLENGE_CONTENT } from '../constants/challenges';
import { format, differenceInDays, parseISO } from 'date-fns';

interface ChallengeStore {
  progress: ChallengeProgress;
  
  initializeChallenges: () => Promise<void>;
  getCurrentChallenge: () => DailyChallenge | null;
  completeChallenge: (day: number) => Promise<void>;
  unlockNextDay: () => void;
  resetChallenge: () => Promise<void>;
  save: () => Promise<void>;
}// Definiert den Zustand und die Aktionen des Challenge Stores -> quasi eine Datenbank für die täglichen Herausforderungen

const createInitialProgress = (): ChallengeProgress => ({
  currentDay: 1,
  challenges: CHALLENGE_CONTENT.map((challenge) => ({
    ...challenge,
    completed: false,
    unlockedAt: challenge.day === 1 ? new Date().toISOString() : undefined,
  })),
  startDate: format(new Date(), 'yyyy-MM-dd'),
}); // Erstellt den initialen Fortschritt für die täglichen Herausforderungen

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
  progress: createInitialProgress(),

  initializeChallenges: async () => {
    try {
      const stored = await AsyncStorage.getItem('challengeProgress');
      
      if (stored) {
        const progress: ChallengeProgress = JSON.parse(stored); // Lade den gespeicherten Fortschritt
        
        const daysSinceStart = differenceInDays(
          new Date(),
          parseISO(progress.startDate)
        ) + 1; // +1 da der Starttag als Tag 1 zählt
        
        const currentDay = Math.min(daysSinceStart, 30); // Maximal 30 Tage
        
        // Unlock alle Tage bis zum aktuellen Tag
        const updatedChallenges = progress.challenges.map((challenge) => {
          if (challenge.day <= currentDay && !challenge.unlockedAt) {
            return {
              ...challenge,
              unlockedAt: new Date().toISOString(),
            };
          }
          return challenge;
        });
        
        set({
          progress: {
            ...progress,
            currentDay,
            challenges: updatedChallenges,
          },
        });
      } else {
        // First time - create fresh progress
        const initialProgress = createInitialProgress();
        set({ progress: initialProgress });
        await AsyncStorage.setItem('challengeProgress', JSON.stringify(initialProgress));
      }
    } catch (error) {
      console.error('Failed to load challenge progress:', error);
    }
  }, // Initialisiert den Fortschritt der täglichen Herausforderungen aus dem AsyncStorage

  getCurrentChallenge: () => {
    const { currentDay, challenges } = get().progress;
    return challenges.find((c) => c.day === currentDay) || null;
  }, // Holt die aktuelle tägliche Herausforderung basierend auf dem aktuellen Tag

  completeChallenge: async (day: number) => {
    set((state) => {
      const updatedChallenges = state.progress.challenges.map((challenge) => {
        if (challenge.day === day && !challenge.completed) {
          return {
            ...challenge,
            completed: true,
            completedAt: new Date().toISOString(),
          };
        }
        return challenge;
      });

      return {
        progress: {
          ...state.progress,
          challenges: updatedChallenges,
        },
      };
    }); // Markiert die Herausforderung eines bestimmten Tages als abgeschlossen

    // Unlock next day
    get().unlockNextDay();
    await get().save();
  },

  unlockNextDay: () => {
    set((state) => {
      const nextDay = state.progress.currentDay + 1;
      
      if (nextDay > 30) return state;

      const updatedChallenges = state.progress.challenges.map((challenge) => {
        if (challenge.day === nextDay && !challenge.unlockedAt) {
          return {
            ...challenge,
            unlockedAt: new Date().toISOString(),
          };
        }
        return challenge;
      });

      return {
        progress: {
          ...state.progress,
          currentDay: nextDay,
          challenges: updatedChallenges,
        },
      };
    });
  }, // Schaltet die Herausforderung für den nächsten Tag frei

  resetChallenge: async () => {
    const initialProgress = createInitialProgress();
    set({ progress: initialProgress });
    await AsyncStorage.setItem('challengeProgress', JSON.stringify(initialProgress));
  }, // Setzt den Fortschritt der täglichen Herausforderungen zurück

  save: async () => {
    try {
      await AsyncStorage.setItem('challengeProgress', JSON.stringify(get().progress));
    } catch (error) {
      console.error('Failed to save challenge progress:', error);
    }
  }, // Speichert den aktuellen Fortschritt der täglichen Herausforderungen im AsyncStorage
}));
