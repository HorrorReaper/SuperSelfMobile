import { DayPlan, Habit, JournalAnswer, JournalEntry, JournalQuestion, JournalTemplate, MicroChallenge, RoutineProgress, RoutineStep, RoutineTemplate, Task, TimeBlock } from './index';


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

export interface ChallengeModalProps {
  visible: boolean;
  challenge: MicroChallenge;
  appName: string;
  onSuccess: () => void;
  onFail: () => void;
  onSkip: () => void;
}

export interface RoutineState {
  templates: RoutineTemplate[];
  activeTemplateId: string | null;
  currentStepIndex: number;
  todayProgress: RoutineProgress | null;
  history: RoutineProgress[];
  
  // Actions
  createTemplate: (template: Omit<RoutineTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<RoutineTemplate>) => void;
  deleteTemplate: (id: string) => void;
  setActiveTemplate: (id: string) => void;
  
  startRoutine: () => void;
  completeStep: (stepId: string) => void;
  skipStep: (stepId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  finishRoutine: () => void;
  resetRoutine: () => void;
  
  getActiveTemplate: () => RoutineTemplate | null;
  getCurrentStep: () => RoutineStep | null;
  getStreak: () => number;
  getTodayCompletionRate: () => number;
}

export interface DayPlanState {
  plans: DayPlan[];
  
  // Actions
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  scheduleTask: (taskId: string, date: string, timeBlockId?: string) => void;
  
  createTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteTimeBlock: (id: string) => void;
  addTaskToTimeBlock: (taskId: string, blockId: string) => void;
  
  getTomorrowPlan: () => DayPlan | null;
  getTodayPlan: () => DayPlan | null;
  getPlanForDate: (date: string) => DayPlan | null;
  getUnscheduledTasks: () => Task[];
  getTasksForDate: (date: string) => Task[];
  getTimeBlocksForDate: (date: string) => TimeBlock[];
}

export interface JournalState {
  templates: JournalTemplate[];
  activeTemplateId: string | null;
  entries: JournalEntry[];
  
  // Actions
  createTemplate: (template: Omit<JournalTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<JournalTemplate>) => void;
  deleteTemplate: (id: string) => void;
  setActiveTemplate: (id: string) => void;
  
  addQuestion: (templateId: string, question: Omit<JournalQuestion, 'id'>) => void;
  updateQuestion: (questionId: string, updates: Partial<JournalQuestion>) => void;
  deleteQuestion: (questionId: string) => void;
  reorderQuestions: (templateId: string, questionIds: string[]) => void;
  
  saveEntry: (answers: Omit<JournalAnswer, 'answeredAt'>[]) => void;
  updateEntry: (entryId: string, answers: JournalAnswer[]) => void;
  deleteEntry: (entryId: string) => void;
  
  getTodayEntry: () => JournalEntry | null;
  getEntryForDate: (date: string) => JournalEntry | null;
  getActiveTemplate: () => JournalTemplate | null;
  getActiveQuestions: () => JournalQuestion[];
  getStreak: () => number;
}
