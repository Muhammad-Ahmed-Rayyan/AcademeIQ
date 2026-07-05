import { create } from 'zustand';
import { api } from './authStore';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action_type: string;
  description: string;
  status: 'approved' | 'rejected' | 'auto';
  category: 'read' | 'write';
  details: string;
}

interface AuditState {
  logs: AuditLogEntry[];
  loading: boolean;
  fetchLogs: () => Promise<void>;
  addLogEntry: (entry: AuditLogEntry) => void;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  loading: false,

  fetchLogs: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/api/audit');
      set({ logs: response.data.entries || [], loading: false });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      set({ loading: false });
    }
  },

  addLogEntry: (entry: AuditLogEntry) => {
    set((state) => {
      // Avoid duplicate logs if SSE streams a log that confirm API already returned
      const exists = state.logs.some((l) => l.id === entry.id);
      if (exists) return state;
      return { logs: [entry, ...state.logs] };
    });
  },

  clearLogs: () => {
    set({ logs: [] });
  },
}));
