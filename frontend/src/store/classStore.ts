import { create } from 'zustand';
import * as api from '../api/classes';
import type { Class, GradeWeight } from '../api/classes';

interface ClassState {
  classes: Class[];
  currentClass: Class | null;
  isLoading: boolean;
  error: string | null;
  fetchClasses: () => Promise<void>;
  fetchClass: (id: number) => Promise<void>;
  createClass: (name: string, section?: string) => Promise<Class>;
  updateClass: (id: number, data: { name?: string; section?: string }) => Promise<void>;
  deleteClass: (id: number) => Promise<void>;
  updateGradeWeights: (classId: number, weights: Omit<GradeWeight, 'id' | 'classId'>) => Promise<void>;
  clearCurrentClass: () => void;
}

export const useClassStore = create<ClassState>((set) => ({
  classes: [],
  currentClass: null,
  isLoading: false,
  error: null,

  fetchClasses: async () => {
    set({ isLoading: true, error: null });
    try {
      const classes = await api.fetchClasses();
      set({ classes, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchClass: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const currentClass = await api.fetchClass(id);
      set({ currentClass, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createClass: async (name, section) => {
    set({ error: null });
    try {
      const newClass = await api.createClass(name, section);
      set((state) => ({ classes: [newClass, ...state.classes] }));
      return newClass;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateClass: async (id, data) => {
    set({ error: null });
    try {
      const updated = await api.updateClass(id, data);
      set((state) => ({
        classes: state.classes.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        currentClass: state.currentClass?.id === id ? { ...state.currentClass, ...updated } : state.currentClass,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteClass: async (id) => {
    set({ error: null });
    try {
      await api.deleteClass(id);
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
        currentClass: state.currentClass?.id === id ? null : state.currentClass,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateGradeWeights: async (classId, weights) => {
    set({ error: null });
    try {
      const updatedWeights = await api.updateGradeWeights(classId, weights);
      set((state) => ({
        classes: state.classes.map((c) =>
          c.id === classId ? { ...c, gradeWeights: updatedWeights } : c
        ),
        currentClass:
          state.currentClass?.id === classId
            ? { ...state.currentClass, gradeWeights: updatedWeights }
            : state.currentClass,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  clearCurrentClass: () => set({ currentClass: null }),
}));
