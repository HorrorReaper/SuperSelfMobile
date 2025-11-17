import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoutineTemplate } from '../types/index';
import { RoutineState } from '../types/componentTypes';
import { defaultTemplate } from '../constants/defaults';


export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({ // Initial State
      templates: [defaultTemplate],
      activeTemplateId: 'default-1',
      currentStepIndex: 0,
      todayProgress: null,
      history: [],

      createTemplate: (template) => {
        const newTemplate: RoutineTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date(),
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      }, //Funktion zum Erstellen einer neuen Routine-Vorlage

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      }, //Funktion zum Aktualisieren einer bestehenden Routine-Vorlage

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          activeTemplateId: state.activeTemplateId === id ? null : state.activeTemplateId,
        }));
      }, //Funktion zum Löschen einer Routine-Vorlage

      setActiveTemplate: (id) => {
        set({ activeTemplateId: id, currentStepIndex: 0 });
      }, //Funktion zum Setzen der aktiven Routine-Vorlage

      startRoutine: () => {
        const today = new Date().toISOString().split('T')[0]; 
        const existingProgress = get().todayProgress;
        
        if (!existingProgress || existingProgress.date !== today) {
          set({
            currentStepIndex: 0,
            todayProgress: {
              date: today,
              completedSteps: [],
              startedAt: new Date(),
              totalTimeSpent: 0,
              streak: get().getStreak(),
            },
          });
        }
      }, //Funktion zum Starten der Morgenroutine für den aktuellen Tag

      completeStep: (stepId) => {
        const template = get().getActiveTemplate();
        if (!template) return;

        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === template.id
              ? {
                  ...t,
                  steps: t.steps.map((s) =>
                    s.id === stepId
                      ? { ...s, completedToday: true, completedAt: new Date() }
                      : s
                  ),
                }
              : t
          ),
          todayProgress: state.todayProgress
            ? {
                ...state.todayProgress,
                completedSteps: [...state.todayProgress.completedSteps, stepId],
              }
            : null,
        }));
      }, //Funktion zum Abschließen eines Schritts in der Morgenroutine

      skipStep: (stepId) => {
        // Just move to next step without marking complete
        get().nextStep();
      }, //Funktion zum Überspringen eines Schritts in der Morgenroutine

      nextStep: () => {
        const template = get().getActiveTemplate();
        if (!template) return;

        set((state) => ({
          currentStepIndex: Math.min(
            state.currentStepIndex + 1,
            template.steps.length - 1
          ),
        }));
      }, // Funktion zum Wechseln zum nächsten Schritt in der Morgenroutine

      previousStep: () => {
        set((state) => ({
          currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
        }));
      }, // Funktion zum Wechseln zum vorherigen Schritt in der Morgenroutine

      finishRoutine: () => {
        const progress = get().todayProgress;
        if (progress) {
          set((state) => ({
            todayProgress: {
              ...progress,
              completedAt: new Date(),
            },
            history: [...state.history, { ...progress, completedAt: new Date() }],
            currentStepIndex: 0,
          }));
        }
      }, // Funktion zum Abschließen der Morgenroutine für den aktuellen Tag

      resetRoutine: () => {
        set({ currentStepIndex: 0 });
      }, // Funktion zum Zurücksetzen der Morgenroutine auf den Anfang

      getActiveTemplate: () => {
        const state = get();
        return state.templates.find((t) => t.id === state.activeTemplateId) || null;
      }, // Funktion zum Abrufen der aktiven Routine-Vorlage

      getCurrentStep: () => {
        const template = get().getActiveTemplate();
        if (!template) return null;
        return template.steps[get().currentStepIndex] || null;
      }, // Funktion zum Abrufen des aktuellen Schritts in der Morgenroutine

      getStreak: () => {
        const history = get().history;
        if (history.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          
          const hasEntry = history.some((p) => p.date === dateStr && p.completedAt);
          if (hasEntry) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        
        return streak;
      }, // Funktion zum Abrufen der aktuellen Streak der Morgenroutine

      getTodayCompletionRate: () => {
        const template = get().getActiveTemplate();
        const progress = get().todayProgress;
        
        if (!template || !progress) return 0;
        
        const totalSteps = template.steps.filter((s) => !s.isOptional).length;
        const completedSteps = progress.completedSteps.length;
        
        return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
      },
    }), // Ende des State-Objekts
    {
      name: 'routine-storage',
      storage: createJSONStorage(() => AsyncStorage),
    } // Ende der Persistenz-Konfiguration
  )
);
