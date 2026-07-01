import { create } from 'zustand';
import axios from 'axios';

// Get API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Axios instance with credentials (cookies) enabled
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export interface User {
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'mock';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: 'real' | 'mock';
  checkAuth: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  mode: 'mock',

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      if (response.data.authenticated) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          mode: response.data.mode,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          mode: response.data.mode,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to verify auth status', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: () => {
    // Redirect to backend OAuth initiator (Google or Mock)
    window.location.href = `${API_BASE_URL}/auth/login`;
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.get('/auth/logout');
    } catch (error) {
      console.error('Logout error on backend', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      // Redirect to login page
      window.location.href = '/login';
    }
  },
}));
