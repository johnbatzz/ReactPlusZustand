import { create } from 'zustand';
import * as api from '../api/studentAuth';
import type { StudentInfo } from '../api/studentAuth';

interface StudentAuthState {
  student: StudentInfo | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (studentId: string, password: string, classId?: number) => Promise<void>;
  setPassword: (studentId: string, classId: number, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useStudentAuthStore = create<StudentAuthState>((set) => ({
  student: null,
  token: localStorage.getItem('studentToken'),
  isLoading: !!localStorage.getItem('studentToken'),
  error: null,

  login: async (studentId, password, classId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.studentLogin(studentId, password, classId);
      localStorage.setItem('studentToken', data.token);
      set({ student: data.student, token: data.token, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setPassword: async (studentId, classId, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.setStudentPassword(studentId, classId, password);
      localStorage.setItem('studentToken', data.token);
      set({ student: data.student, token: data.token, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('studentToken');
    set({ student: null, token: null, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const student = await api.getStudentMe();
      set({ student, isLoading: false });
    } catch {
      localStorage.removeItem('studentToken');
      set({ student: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
