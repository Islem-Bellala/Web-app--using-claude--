import { create } from 'zustand';
import type { ThemeMode } from '../types/ui';

interface UIState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  activePage: string;

  // Actions
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePage: (page: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  activePage: 'params',

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePage: (page) => set({ activePage: page }),
}));
