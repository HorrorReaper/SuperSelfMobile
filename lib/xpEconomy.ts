import { XP_CONFIG, REDEMPTION_CONFIG } from '../constants/config';
import { XPTransaction } from '../types';

export const calculateTaskXP = (isCompleted: boolean): number => {
  return isCompleted ? XP_CONFIG.TASK_BASE : 0;
}; // Diese Funktion berechnet die XP für eine abgeschlossene Aufgabe basierend auf der Konfiguration

export const calculateHabitXP = (streak: number): number => {
  const base = XP_CONFIG.HABIT_BASE;
  const bonus = streak > 3 ? (streak - 3) * XP_CONFIG.STREAK_BONUS : 0; // Bonus XP für Serien über 3 Tage
  return base + bonus;
}; // Diese Funktion berechnet die XP für eine gepflegte Gewohnheit basierend auf der aktuellen Serie

export const calculateDailyXP = (transactions: XPTransaction[]): number => {
  const today = new Date().toISOString().split('T')[0];
  const todayEarnings = transactions.filter(
    (t) => t.type === 'earn' && t.timestamp.startsWith(today)
  ); // Filtert die Transaktionen, die heute verdient wurden
  return Math.min(
    todayEarnings.reduce((sum, t) => sum + t.amount, 0),
    XP_CONFIG.DAILY_CAP
  ); 
}; // Diese Funktion berechnet die gesamten XP, die an einem Tag verdient wurden, begrenzt durch das Tageslimit

export const canRedeem = (currentXP: number, minutesRequested: number, lastRedemptionTime: string | undefined, todayRedeemed: number): { allowed: boolean; reason?: string } => {
  const xpNeeded = (minutesRequested / 10) * REDEMPTION_CONFIG.XP_PER_10_MIN; // Berechnet die benötigten XP für die angeforderten Minuten

  if (currentXP < xpNeeded) {
    return { allowed: false, reason: 'Schade, keine XP mehr :(' };
  }

  if (todayRedeemed + minutesRequested > REDEMPTION_CONFIG.MAX_MINUTES_PER_DAY) {
    return { allowed: false, reason: 'Tägliches Limit erreicht' };
  }

  if (lastRedemptionTime) {
    const hoursSinceLastRedemption =
      (Date.now() - new Date(lastRedemptionTime).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastRedemption < REDEMPTION_CONFIG.COOLDOWN_HOURS) {
      return { allowed: false, reason: 'Cooldown aktiv' };
    }
  }

  return { allowed: true };
}; // Diese Funktion überprüft, ob der Nutzer XP für die angeforderten Minuten einlösen kann, basierend auf verschiedenen Bedingungen
