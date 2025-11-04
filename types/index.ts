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
