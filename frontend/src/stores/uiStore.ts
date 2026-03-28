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

function applyThemeClass(theme: ThemeMode) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  activePage: 'params',

  toggleTheme: () =>
    set((state) => {
      const next: ThemeMode = state.theme === 'dark' ? 'light' : 'dark'
      applyThemeClass(next)
      return { theme: next }
    }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePage: (page) => set({ activePage: page }),
}));
