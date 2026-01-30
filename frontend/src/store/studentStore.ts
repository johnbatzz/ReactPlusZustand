import { create } from 'zustand';
import * as api from '../api/students';
import type { Student, StudentInput } from '../api/students';

interface StudentState {
  students: Student[];
  currentStudent: Student | null;
  isLoading: boolean;
  error: string | null;
  fetchStudents: (classId: number) => Promise<void>;
  fetchStudent: (id: number) => Promise<void>;
  createStudent: (classId: number, data: StudentInput) => Promise<Student>;
  updateStudent: (id: number, data: Partial<StudentInput>) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
  clearStudents: () => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  currentStudent: null,
  isLoading: false,
  error: null,

  fetchStudents: async (classId) => {
    set({ isLoading: true, error: null });
    try {
      const students = await api.fetchStudents(classId);
      set({ students, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchStudent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const currentStudent = await api.fetchStudent(id);
      set({ currentStudent, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createStudent: async (classId, data) => {
    set({ error: null });
    try {
      const newStudent = await api.createStudent(classId, data);
      set((state) => ({ students: [...state.students, newStudent].sort((a, b) => a.name.localeCompare(b.name)) }));
      return newStudent;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateStudent: async (id, data) => {
    set({ error: null });
    try {
      const updated = await api.updateStudent(id, data);
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? updated : s)),
        currentStudent: state.currentStudent?.id === id ? updated : state.currentStudent,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteStudent: async (id) => {
    set({ error: null });
    try {
      await api.deleteStudent(id);
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        currentStudent: state.currentStudent?.id === id ? null : state.currentStudent,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  clearStudents: () => set({ students: [], currentStudent: null }),
}));
