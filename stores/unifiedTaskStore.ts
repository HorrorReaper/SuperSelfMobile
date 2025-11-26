import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { calculateStreak, isCompletedToday } from '../lib/streakCalculator';
import { calculateTaskXP, calculateHabitXP } from '../lib/xpEconomy';
import { JOURNEY_CONFIG } from '../constants/config';

// Types
export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  category: 'work' | 'personal' | 'health' | 'learning' | 'other';
  color: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  xpValue: number;
  createdAt: string;
  completedAt?: string;
  timeBlockId?: string;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  xpValue: number;
  frequency: 'daily' | 'weekly';
  createdAt: string;
  completedToday: boolean;
  history: string[]; // Array of dates in 'yyyy-MM-dd' format
}

export interface DailyPlan {
  date: string; // yyyy-MM-dd
  intention: string;
  timeBlocks: TimeBlock[];
  tasks: Task[];
  habits: string[]; // Habit IDs
  xpEarned: number;
  xpSpent: number;
  reflectionCompleted: boolean;
  reflectionText?: string;
}

interface UnifiedTaskStore {
  habits: Habit[];
  dailyPlans: Record<string, DailyPlan>;

  // Initialization
  initializeStore: () => Promise<void>;
  createDefaultHabits: () => void;

  // Daily Plan
  getTodayPlan: () => DailyPlan;
  getTomorrowPlan: () => DailyPlan;
  getPlanForDate: (date: string) => DailyPlan;
  setIntention: (date: string, intention: string) => Promise<void>;

  // Time Blocks
  addTimeBlock: (date: string, block: Omit<TimeBlock, 'id'>) => Promise<void>;
  removeTimeBlock: (date: string, blockId: string) => Promise<void>;
  updateTimeBlock: (date: string, blockId: string, updates: Partial<TimeBlock>) => Promise<void>;

  // Tasks
  addTask: (date: string, title: string, priority?: 'high' | 'medium' | 'low') => Promise<void>;
  toggleTask: (date: string, taskId: string, onXPEarned: (xp: number) => void) => Promise<void>;
  removeTask: (date: string, taskId: string) => Promise<void>;
  updateTask: (date: string, taskId: string, updates: Partial<Task>) => Promise<void>;

  // Habits
  toggleHabit: (habitId: string, onXPEarned: (xp: number) => void) => Promise<void>;
  addHabit: (title: string) => Promise<void>;
  removeHabit: (habitId: string) => Promise<void>;
  getHabitStreak: (habitId: string) => number;

  // Reflection
  submitReflection: (date: string, text: string, onXPEarned?: (xp: number) => void) => Promise<void>;

  // Stats
  getTotalXP: () => number;
  getDayCompletionRate: (date: string) => number;
  getLongestStreak: () => number;

  // Persistence
  save: () => Promise<void>;
}

const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return format(tomorrow, 'yyyy-MM-dd');
};

export const useUnifiedTaskStore = create<UnifiedTaskStore>()(
  persist(
    (set, get) => ({
      habits: [],
      dailyPlans: {},

      // INITIALIZATION
      initializeStore: async () => {
        try {
          const storedHabits = await AsyncStorage.getItem('habits');
          const storedPlans = await AsyncStorage.getItem('dailyPlans');

          if (storedHabits) {
            set({ habits: JSON.parse(storedHabits) });
          } else {
            get().createDefaultHabits();
          }

          if (storedPlans) {
            set({ dailyPlans: JSON.parse(storedPlans) });
          }
        } catch (error) {
          console.error('Failed to load task data:', error);
        }
      },

      createDefaultHabits: () => {
        const habits: Habit[] = JOURNEY_CONFIG.DEFAULT_HABITS.map((title, idx) => ({
          id: `habit_${idx}`,
          title,
          streak: 0,
          xpValue: 5,
          frequency: 'daily' as const,
          createdAt: new Date().toISOString(),
          completedToday: false,
          history: [],
        }));
        set({ habits });
        get().save();
      },

      // DAILY PLAN
      getPlanForDate: (date: string) => {
        const plan = get().dailyPlans[date];
        if (plan) return plan;

        const newPlan: DailyPlan = {
          date,
          intention: '',
          timeBlocks: [],
          tasks: [],
          habits: get().habits.map((h) => h.id),
          xpEarned: 0,
          xpSpent: 0,
          reflectionCompleted: false,
        };

        set((state) => ({
          dailyPlans: { ...state.dailyPlans, [date]: newPlan },
        }));

        return newPlan;
      },

      getTodayPlan: () => get().getPlanForDate(getTodayDate()),
      getTomorrowPlan: () => get().getPlanForDate(getTomorrowDate()),

      setIntention: async (date: string, intention: string) => {
        set((state) => {
          const plan = state.dailyPlans[date] || get().getPlanForDate(date);
          return {
            dailyPlans: {
              ...state.dailyPlans,
              [date]: { ...plan, intention },
            },
          };
        });
        await get().save();
      },

      // TIME BLOCKS
      addTimeBlock: async (date: string, block: Omit<TimeBlock, 'id'>) => {
        set((state) => {
          const plan = state.dailyPlans[date] || get().getPlanForDate(date);
          const newBlock: TimeBlock = {
            ...block,
            id: `block_${Date.now()}_${Math.random()}`,
          };

          return {
            dailyPlans: {
              ...state.dailyPlans,
              [date]: {
                ...plan,
                timeBlocks: [...plan.timeBlocks, newBlock],
              },
            },
          };
        });
        await get().save();
      },

      removeTimeBlock: async (date: string, blockId: string) => {
        set((state) => {
          const plan = state.dailyPlans[date];
          if (!plan) return state;

          return {
            dailyPlans: {
              ...state.dailyPlans,
              [date]: {
                ...plan,
                timeBlocks: plan.timeBlocks.filter((b) => b.id !== blockId),
              },
            },
          };
        });
        await get().save();
      },

      updateTimeBlock: async (date: string, blockId: string, updates: Partial<TimeBlock>) => {
        set((state) => {
          const plan = state.dailyPlans[date];
          if (!plan) return state;

          return {
            dailyPlans: {
              ...state.dailyPlans,
              [date]: {
                ...plan,
                timeBlocks: plan.timeBlocks.map((b) =>
                  b.id === blockId ? { ...b, ...updates } : b
                ),
              },
            },
          };
        });
        await get().save();
      },

      // TASKS
      addTask: async (date: string, title: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
        const task: Task = {
          id: `task_${Date.now()}_${Math.random()}`,
          title,
          completed: false,
          priority,
          xpValue: priority === 'high' ? 15 : priority === 'medium' ? 10 : 5,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const plan = state.dailyPlans[date] || get().getPlanForDate(date);
          return {
            dailyPlans: {
              ...state.dailyPlans,
              [date]: {
                ...plan,
                tasks: [...plan.tasks, task],
              },
            },
          };
        });

        await get().save();
      },

      toggleTask: async (date: string, taskId: string, onXPEarned: (xp: number) => void) => {
        set((state) => {
          const plan = state.dailyPlans[date];
          if (!plan) return state;

          let xpDelta = 0;

          const updatedTasks = plan.tasks.map((task) => {
            if (task.id === taskId) {
              const newCompleted = !task.completed;
              
              if (newCompleted) {
                xpDelta = calculateTaskXP(true);
                onXPEarned(xpDelta);
              } else {
                xpDelta = -task.xpValue; // Remove XP when uncompleting
              }

              return {
                ...task,
                completed: newCompleted,
                completedAt: newCompleted ? new Date().toISOString() : undefined,
              };
            }
            return task;
          });

          return {
            dailyPlans: {
              ...state.dailyPlans,
              [date]: {
                ...plan,
                tasks: updatedTasks,
                xpEarned: Math.max(0, plan.xpEarned + xpDelta),
              },
            },
          };
        });

        await get().save();
      },

      removeTask: async (date: string, taskId: string) => {
        set((state) => {
          const plan = state.dailyPlans[date];
          if (!plan) return state;

          return {
            dailyPlans: {
              ...state.dailyPlans,
              [date]: {
                ...plan,
                tasks: plan.tasks.filter((t) => t.id !== taskId),
              },
            },
          };
        });
        await get().save();
      },

      updateTask: async (date: string, taskId: string, updates: Partial<Task>) => {
        set((state) => {
          const plan = state.dailyPlans[date];
          if (!plan) return state;

          return {
            dailyPlans: {
              ...state.dailyPlans,
              [date]: {
                ...plan,
                tasks: plan.tasks.map((t) =>
                  t.id === taskId ? { ...t, ...updates } : t
                ),
              },
            },
          };
        });
        await get().save();
      },

      // HABITS
      toggleHabit: async (habitId: string, onXPEarned: (xp: number) => void) => {
        const today = getTodayDate();

        set((state) => {
          const updatedHabits = state.habits.map((habit) => {
            if (habit.id === habitId) {
              const alreadyCompleted = isCompletedToday(habit.history);

              if (alreadyCompleted) {
                // Uncomplete
                return {
                  ...habit,
                  history: habit.history.filter((d) => d !== today),
                  streak: calculateStreak(habit.history.filter((d) => d !== today)),
                  completedToday: false,
                };
              } else {
                // Complete
                const newHistory = [...habit.history, today];
                const newStreak = calculateStreak(newHistory);
                const xp = calculateHabitXP(newStreak);
                onXPEarned(xp);

                // Update today's plan XP
                const todayPlan = state.dailyPlans[today] || get().getTodayPlan();
                state.dailyPlans[today] = {
                  ...todayPlan,
                  xpEarned: todayPlan.xpEarned + xp,
                };

                return {
                  ...habit,
                  history: newHistory,
                  streak: newStreak,
                  completedToday: true,
                };
              }
            }
            return habit;
          });

          return { habits: updatedHabits };
        });

        await get().save();
      },

      addHabit: async (title: string) => {
        const newHabit: Habit = {
          id: `habit_${Date.now()}`,
          title,
          streak: 0,
          xpValue: 5,
          frequency: 'daily',
          createdAt: new Date().toISOString(),
          completedToday: false,
          history: [],
        };

        set((state) => ({
          habits: [...state.habits, newHabit],
        }));

        await get().save();
      },

      removeHabit: async (habitId: string) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habitId),
        }));
        await get().save();
      },

      getHabitStreak: (habitId: string) => {
        const habit = get().habits.find((h) => h.id === habitId);
        return habit?.streak || 0;
      },

      // REFLECTION
      submitReflection: async (date: string, text: string, onXPEarned?: (xp: number) => void) => {
        const reflectionXP = 20;

        set((state) => {
          const plan = state.dailyPlans[date] || get().getPlanForDate(date);
          
          if (onXPEarned && !plan.reflectionCompleted) {
            onXPEarned(reflectionXP);
          }

          return {
            dailyPlans: {
              ...state.dailyPlans,
              [date]: {
                ...plan,
                reflectionCompleted: true,
                reflectionText: text,
                xpEarned: plan.reflectionCompleted ? plan.xpEarned : plan.xpEarned + reflectionXP,
              },
            },
          };
        });

        await get().save();
      },

      // STATS
      getTotalXP: () => {
        const plans = Object.values(get().dailyPlans);
        return plans.reduce((total, plan) => total + plan.xpEarned, 0);
      },

      getDayCompletionRate: (date: string) => {
        const plan = get().dailyPlans[date];
        if (!plan || plan.tasks.length === 0) return 0;

        const completedTasks = plan.tasks.filter((t) => t.completed).length;
        return Math.round((completedTasks / plan.tasks.length) * 100);
      },

      getLongestStreak: () => {
        const habits = get().habits;
        return Math.max(...habits.map((h) => h.streak), 0);
      },

      // PERSISTENCE
      save: async () => {
        try {
          await AsyncStorage.setItem('habits', JSON.stringify(get().habits));
          await AsyncStorage.setItem('dailyPlans', JSON.stringify(get().dailyPlans));
        } catch (error) {
          console.error('Failed to save task data:', error);
        }
      },
    }),
    {
      name: 'unified-task-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
