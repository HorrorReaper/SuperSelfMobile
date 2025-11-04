import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';

export const calculateStreak = (completionDates: string[]): number => {
  if (completionDates.length === 0) return 0; //Keine abgeschlossenen Tage, also keine Streak

  const sortedDates = completionDates
    .map((d) => startOfDay(parseISO(d)))
    .sort((a, b) => b.getTime() - a.getTime()); //Sortiere die Daten absteigend nach Datum (Neueste zuerst)

  const today = startOfDay(new Date());
  let streak = 0;

  // Überprüfen, ob heute oder gestern abgeschlossen wurde
  const daysDiff = differenceInDays(today, sortedDates[0]);
  if (daysDiff > 1) return 0; // Streak ist unterbrochen

  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = startOfDay(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
    if (sortedDates[i].getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  } // Streak wird unterbrochen, wenn ein Tag fehlt 

  return streak;
};

export const isCompletedToday = (completionDates: string[]): boolean => {
  const today = format(new Date(), 'yyyy-MM-dd'); // Heutiges Datum im Format 'YYYY-MM-DD'
  return completionDates.includes(today);
}; // Überprüft, ob die Gewohnheit heute abgeschlossen wurde
