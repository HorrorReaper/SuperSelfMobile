import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimeBlock {
  id: string;
  startTime: string; // HH:MM format
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
  timeBlockId?: string;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  intention: string;
  timeBlocks: TimeBlock[];
  tasks: Task[];
  createdAt: number;
}

interface DayPlanState {
  plans: DayPlan[];
  getTomorrowPlan: () => DayPlan | undefined;
  getTodayPlan: () => DayPlan | undefined;
  createOrUpdatePlan: (date: string, intention: string) => void;
  addTimeBlock: (date: string, block: Omit<TimeBlock, 'id'>) => void;
  removeTimeBlock: (date: string, blockId: string) => void;
  addTask: (date: string, task: Omit<Task, 'id'>) => void;
  toggleTask: (date: string, taskId: string) => void;
  removeTask: (date: string, taskId: string) => void;
  updateTask: (date: string, taskId: string, updates: Partial<Task>) => void;
}

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const useDayPlanStore = create<DayPlanState>()(
  persist(
    (set, get) => ({
      plans: [],

      getTomorrowPlan: () => {
        const tomorrowDate = getTomorrowDate();
        return get().plans.find(p => p.date === tomorrowDate);
      },

      getTodayPlan: () => {
        const todayDate = getTodayDate();
        return get().plans.find(p => p.date === todayDate);
      },

      createOrUpdatePlan: (date: string, intention: string) => {
        set(state => {
          const existingIndex = state.plans.findIndex(p => p.date === date);
          
          if (existingIndex >= 0) {
            // Update existing plan
            const updatedPlans = [...state.plans];
            updatedPlans[existingIndex] = {
              ...updatedPlans[existingIndex],
              intention,
            };
            return { plans: updatedPlans };
          } else {
            // Create new plan
            const newPlan: DayPlan = {
              date,
              intention,
              timeBlocks: [],
              tasks: [],
              createdAt: Date.now(),
            };
            return { plans: [...state.plans, newPlan] };
          }
        });
      },

      addTimeBlock: (date: string, block: Omit<TimeBlock, 'id'>) => {
        set(state => {
          const planIndex = state.plans.findIndex(p => p.date === date);
          
          if (planIndex >= 0) {
            const updatedPlans = [...state.plans];
            const newBlock: TimeBlock = {
              ...block,
              id: `${Date.now()}-${Math.random()}`,
            };
            
            updatedPlans[planIndex] = {
              ...updatedPlans[planIndex],
              timeBlocks: [...updatedPlans[planIndex].timeBlocks, newBlock],
            };
            
            return { plans: updatedPlans };
          }
          
          return state;
        });
      },

      removeTimeBlock: (date: string, blockId: string) => {
        set(state => {
          const planIndex = state.plans.findIndex(p => p.date === date);
          
          if (planIndex >= 0) {
            const updatedPlans = [...state.plans];
            updatedPlans[planIndex] = {
              ...updatedPlans[planIndex],
              timeBlocks: updatedPlans[planIndex].timeBlocks.filter(b => b.id !== blockId),
            };
            
            return { plans: updatedPlans };
          }
          
          return state;
        });
      },

      addTask: (date: string, task: Omit<Task, 'id'>) => {
        set(state => {
          const planIndex = state.plans.findIndex(p => p.date === date);
          
          if (planIndex >= 0) {
            const updatedPlans = [...state.plans];
            const newTask: Task = {
              ...task,
              id: `${Date.now()}-${Math.random()}`,
            };
            
            updatedPlans[planIndex] = {
              ...updatedPlans[planIndex],
              tasks: [...updatedPlans[planIndex].tasks, newTask],
            };
            
            console.log('Task added:', newTask);
            console.log('Updated plan:', updatedPlans[planIndex]);
            
            return { plans: updatedPlans };
          }
          
          return state;
        });
      },

      toggleTask: (date: string, taskId: string) => {
        set(state => {
          const planIndex = state.plans.findIndex(p => p.date === date);
          
          if (planIndex >= 0) {
            const updatedPlans = [...state.plans];
            updatedPlans[planIndex] = {
              ...updatedPlans[planIndex],
              tasks: updatedPlans[planIndex].tasks.map(t =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
              ),
            };
            
            return { plans: updatedPlans };
          }
          
          return state;
        });
      },

      removeTask: (date: string, taskId: string) => {
        set(state => {
          const planIndex = state.plans.findIndex(p => p.date === date);
          
          if (planIndex >= 0) {
            const updatedPlans = [...state.plans];
            updatedPlans[planIndex] = {
              ...updatedPlans[planIndex],
              tasks: updatedPlans[planIndex].tasks.filter(t => t.id !== taskId),
            };
            
            return { plans: updatedPlans };
          }
          
          return state;
        });
      },

      updateTask: (date: string, taskId: string, updates: Partial<Task>) => {
        set(state => {
          const planIndex = state.plans.findIndex(p => p.date === date);
          
          if (planIndex >= 0) {
            const updatedPlans = [...state.plans];
            updatedPlans[planIndex] = {
              ...updatedPlans[planIndex],
              tasks: updatedPlans[planIndex].tasks.map(t =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
            };
            
            return { plans: updatedPlans };
          }
          
          return state;
        });
      },
    }),
    {
      name: 'day-plan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
