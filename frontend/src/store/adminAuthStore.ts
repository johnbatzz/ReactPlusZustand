import { create } from 'zustand';
import * as api from '../api/admin';
import type { AdminInfo } from '../api/admin';

interface AdminAuthState {
  admin: AdminInfo | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  admin: null,
  token: localStorage.getItem('adminToken'),
  isLoading: !!localStorage.getItem('adminToken'),
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.adminLogin(email, password);
      localStorage.setItem('adminToken', data.token);
      set({ admin: data.admin, token: data.token, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    set({ admin: null, token: null, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const admin = await api.getAdminMe();
      set({ admin, isLoading: false });
    } catch {
      localStorage.removeItem('adminToken');
      set({ admin: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
