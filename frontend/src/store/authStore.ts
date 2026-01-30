import { create } from 'zustand';
import * as api from '../api/auth';
import type { Teacher } from '../api/auth';

interface AuthState {
  teacher: Teacher | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  teacher: null,
  token: localStorage.getItem('token'),
  isLoading: !!localStorage.getItem('token'),
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { teacher, token } = await api.login(email, password);
      localStorage.setItem('token', token);
      set({ teacher, token, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { teacher, token } = await api.register(email, password, name);
      localStorage.setItem('token', token);
      set({ teacher, token, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ teacher: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ teacher: null, token: null });
      return;
    }
    set({ isLoading: true });
    try {
      const teacher = await api.getMe();
      set({ teacher, token, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ teacher: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
