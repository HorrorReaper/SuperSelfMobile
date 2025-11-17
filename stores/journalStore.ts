import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalQuestion, JournalEntry, JournalTemplate, JournalAnswer } from '../types/index';
import { defaultTemplateJournal } from '../constants/defaults';
import { JournalState } from '../types/componentTypes';





export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      templates: [defaultTemplateJournal],
      activeTemplateId: 'default-journal-1',
      entries: [],

      createTemplate: (template) => {
        const newTemplate: JournalTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date(),
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          activeTemplateId: state.activeTemplateId === id ? null : state.activeTemplateId,
        }));
      },

      setActiveTemplate: (id) => {
        set({ activeTemplateId: id });
      },

      addQuestion: (templateId, question) => {
        const newQuestion: JournalQuestion = {
          ...question,
          id: `q-${Date.now()}`,
        };

        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId
              ? { ...t, questions: [...t.questions, newQuestion] }
              : t
          ),
        }));
      },

      updateQuestion: (questionId, updates) => {
        set((state) => ({
          templates: state.templates.map((t) => ({
            ...t,
            questions: t.questions.map((q) =>
              q.id === questionId ? { ...q, ...updates } : q
            ),
          })),
        }));
      },

      deleteQuestion: (questionId) => {
        set((state) => ({
          templates: state.templates.map((t) => ({
            ...t,
            questions: t.questions.filter((q) => q.id !== questionId),
          })),
        }));
      },

      reorderQuestions: (templateId, questionIds) => {
        set((state) => ({
          templates: state.templates.map((t) => {
            if (t.id !== templateId) return t;
            
            const reordered = questionIds.map((id, index) => {
              const question = t.questions.find((q) => q.id === id);
              return question ? { ...question, order: index + 1 } : null;
            }).filter(Boolean) as JournalQuestion[];
            
            return { ...t, questions: reordered };
          }),
        }));
      },

      saveEntry: (answers) => {
        const today = new Date().toISOString().split('T')[0];
        const existingEntry = get().getTodayEntry();

        const journalAnswers: JournalAnswer[] = answers.map((a) => ({
          ...a,
          answeredAt: new Date(),
        }));

        if (existingEntry) {
          set((state) => ({
            entries: state.entries.map((e) =>
              e.id === existingEntry.id
                ? { ...e, answers: journalAnswers, updatedAt: new Date() }
                : e
            ),
          }));
        } else {
          const newEntry: JournalEntry = {
            id: `entry-${Date.now()}`,
            date: today,
            answers: journalAnswers,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({ entries: [...state.entries, newEntry] }));
        }
      },

      updateEntry: (entryId, answers) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId ? { ...e, answers, updatedAt: new Date() } : e
          ),
        }));
      },

      deleteEntry: (entryId) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== entryId),
        }));
      },

      getTodayEntry: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().entries.find((e) => e.date === today) || null;
      },

      getEntryForDate: (date) => {
        return get().entries.find((e) => e.date === date) || null;
      },

      getActiveTemplate: () => {
        const state = get();
        return state.templates.find((t) => t.id === state.activeTemplateId) || null;
      },

      getActiveQuestions: () => {
        const template = get().getActiveTemplate();
        return template?.questions.filter((q) => q.isActive).sort((a, b) => a.order - b.order) || [];
      },

      getStreak: () => {
        const entries = get().entries;
        if (entries.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          
          const hasEntry = entries.some((e) => e.date === dateStr);
          if (hasEntry) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        
        return streak;
      },
    }),
    {
      name: 'journal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
