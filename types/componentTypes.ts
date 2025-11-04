import { Habit, Task } from './index';


export interface XPBarProps {
  currentXP: number;
  maxXP?: number;
}

export interface TaskCardProps {
  task: Task;
  onToggle: () => void;
}
export interface RedemptionTimerProps {
  durationMinutes: number;
  onComplete: () => void;
}
export interface HabitCardProps {
  habit: Habit;
  onToggle: () => void;
}