import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Async Storage ist eine einfache, unverschlüsselte, asynchrone, persistente, key-value Speicher-API für React Native Apps
import { UserProfile, XPTransaction } from '../types';
import { format } from 'date-fns';

interface UserStore {
  profile: UserProfile;
  transactions: XPTransaction[];
  
  initializeUser: () => Promise<void>;
  addXP: (amount: number, source: string) => Promise<void>;
  redeemXP: (amount: number, minutes: number) => Promise<void>;
  incrementStreak: () => Promise<void>;
  getTodayRedeemed: () => number;
  save: () => Promise<void>;
} // Definiert den Zustand und die Aktionen des User Stores -> quasi eine Datenbank für das Nutzerprofil und die XP-Transaktionen

const defaultProfile: UserProfile = {
  currentXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  journeyStartDate: format(new Date(), 'yyyy-MM-dd'),
  journeyDay: 1,
}; // Standard-Nutzerprofil für neue Nutzer

export const useUserStore = create<UserStore>((set, get) => ({
  profile: defaultProfile,
  transactions: [],

  initializeUser: async () => {
    try {
      const stored = await AsyncStorage.getItem('userProfile'); // Lade das gespeicherte Nutzerprofil aus dem AsyncStorage (der AsyncStorage wird verwendet, um Daten lokal auf dem Gerät zu speichern und abzurufen)
      const storedTransactions = await AsyncStorage.getItem('transactions'); // Lade die gespeicherten XP-Transaktionen aus dem AsyncStorage
      
      if (stored) {
        const profile = JSON.parse(stored); // Wenn ein gespeichertes Profil vorhanden ist, parse es aus dem JSON-String
        const transactions = storedTransactions ? JSON.parse(storedTransactions) : []; // Wenn gespeicherte Transaktionen vorhanden sind, parse sie aus dem JSON-String
        set({ profile, transactions }); // Setze den Zustand des Stores mit dem geladenen Profil und den Transaktionen
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, // Initialisiert das Nutzerprofil und die Transaktionen aus dem AsyncStorage

  addXP: async (amount: number, source: string) => {
    const transaction: XPTransaction = {
      id: Date.now().toString(),
      type: 'earn',
      amount,
      source,
      timestamp: new Date().toISOString(),
    }; // Erstelle eine neue XP-Transaktion

    set((state) => ({
      profile: {
        ...state.profile,
        currentXP: state.profile.currentXP + amount,
      },
      transactions: [...state.transactions, transaction],
    })); // Aktualisiere den Zustand des Stores mit dem neuen XP-Wert und der neuen Transaktion

    await get().save(); // Speichere die aktualisierten Daten im AsyncStorage
  }, // Fügt dem Nutzerprofil XP hinzu und erstellt eine entsprechende Transaktion

  redeemXP: async (amount: number, minutes: number) => {
    const transaction: XPTransaction = {
      id: Date.now().toString(),
      type: 'spend',
      amount,
      source: `doomscroll_${minutes}min`,
      timestamp: new Date().toISOString(),
    }; // Erstelle eine neue XP-Transaktion für die Einlösung

    set((state) => ({
      profile: {
        ...state.profile,
        currentXP: state.profile.currentXP - amount,
        lastRedemptionTime: new Date().toISOString(),
      },
      transactions: [...state.transactions, transaction],
    })); // Aktualisiere den Zustand des Stores mit dem neuen XP-Wert und der neuen Transaktion

    await get().save();
  }, // Löst XP ein und erstellt eine entsprechende Transaktion

  incrementStreak: async () => {
    set((state) => {
      const newStreak = state.profile.currentStreak + 1; // Erhöhe die aktuelle Streak um 1
      return {
        profile: {
          ...state.profile,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, state.profile.longestStreak),
        },
      };
    });
    await get().save();
  }, // Erhöht die aktuelle Streak und aktualisiert die längste Streak, falls nötig

  getTodayRedeemed: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayRedemptions = get().transactions.filter(
      (t) => t.type === 'spend' && t.timestamp.startsWith(today)
    ); // Filtert die Transaktionen, um nur die heutigen Einlösungen zu erhalten

    return todayRedemptions.reduce((total, t) => {
      const minutes = parseInt(t.source.split('_')[1]) || 0;
      return total + minutes;
    }, 0);
  }, // Berechnet die insgesamt heute eingelösten Minuten basierend auf den Transaktionen

  save: async () => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(get().profile));
      await AsyncStorage.setItem('transactions', JSON.stringify(get().transactions));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }, // Speichert das Nutzerprofil und die Transaktionen im AsyncStorage
}));
