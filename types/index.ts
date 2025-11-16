//Hier werden die gesamten Typen festgelegt, die im Projekt verwendet werden
export interface Task {
    id: string;
    title: string;
    completed: boolean;
    xpValue: number;
    createdAt: string;
    completedAt?: string;
} //Typ für eine Aufgabe, die der Nutzer erledigen kann

export interface Habit {
    id: string;
    title: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    xpValue: number;
    createdAt: string;
    streak: number;
    completedToday: boolean;
    lastCompletedDate?: string;
    history: string[];
} //Typ für eine Gewohnheit, die der Nutzer pflegen kann

export interface XPTransaction {
    id: string;
    type: 'earn' | 'spend';
    amount: number;
    source: string;
    timestamp: string;
} //Typ für eine XP-Transaktion, die der Nutzer durchführen kann -> kann entweder XP generieren oder ausgeben

export interface DailyPlan {
    date : string;
    tasks: Task[];
    habits: string[];
    xpEarned: number;
    xpSpendt: number;
    reflectionCompleted: boolean;
    reflectionText?: string;
} //Typ für einen Tagesplan, der die Aufgaben und Gewohnheiten eines Tages zusammenfasst

export interface UserProfile {
    currentXP: number;
    currentStreak: number;
    longestStreak: number;
    journeyStartDate: string;
    journeyDay: number;
    lastRedemptionTime?: string
} //Typ für das Nutzerprofil, das den Fortschritt des Nutzers festhält

export interface RedemptionConfig {
  xpPer10Min: number;
  maxMinutesPerDay: number;
  cooldownHours: number;
  dailyXPCap: number;
} //Typ für die Konfiguration der XP-Einlösung

export interface DailyChallenge {
  day: number;
  title: string;
  category: 'mindset' | 'health' | 'productivity' | 'social' | 'habits';
  description: string;
  mission: string;
  tips: string[];
  xpReward: number;
  completed: boolean;
  unlockedAt?: string;
  completedAt?: string;
} //Typ für eine tägliche Herausforderung in der Journey des Nutzers

export interface ChallengeProgress {
  currentDay: number;
  challenges: DailyChallenge[]; //Liste der täglichen Herausforderungen
  startDate: string;
} //Typ für den Fortschritt der täglichen Herausforderungen

export interface BlockedApp {
  packageName: string;
  appName: string;
  icon?: string;
  isBlocked: boolean;
} //Typ für eine blockierte App während einer Blocking Session

export interface BlockingSession {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  xpCost: number;
  blockedApps: string[];
  violations: number;
  completed: boolean;
} //Typ für eine Blocking Session, in der bestimmte Apps blockiert werden

//Hier kommen Typen für das App-Locking System
export type UnblockChallengeType = 'math' | 'breathing' | 'affirmation' | 'why' | 'pushups'; 
//Typen für die verschiedenen Arten vonunblocking Herausforderungen

export interface MicroChallenge {
  id: string;
  type: UnblockChallengeType;
  question?: string;
  answer?: string | number;
  options?: string[];
  duration?: number; // seconds
  instruction: string;
} //Typ für eine Mikro-Herausforderung bevor man eine App öffnen kann

export interface ChallengeAttempt {
  challengeId: string;
  appPackage: string;
  appName: string;
  timestamp: string;
  success: boolean;
  timeToComplete: number; // seconds
} //Typ für einen Versuch, eine Herausforderung zu meistern

export interface AppUnlock {
  packageName: string;
  unlockedAt: string;
  expiresAt: string;
  challengeCompleted: string;
} //Typ für eine Freischaltung einer App nach erfolgreichem Abschluss einer Herausforderung

// Update BlockingSession
export interface BlockingSession {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  xpCost: number;
  blockedApps: string[];
  violations: number;
  successfulChallenges: number;
  failedChallenges: number;
  completed: boolean;
  unlocks: AppUnlock[];
} //Typ für eine Blocking Session, in der bestimmte Apps blockiert werden

