import { create } from 'zustand';
import type { ThemeMode } from '../types/ui';

function applyTheme(theme: ThemeMode) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('bunyan-theme', theme)
}

const savedTheme = (localStorage.getItem('bunyan-theme') as ThemeMode | null) ?? 'light'
applyTheme(savedTheme)

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
  theme: savedTheme,
  sidebarOpen: true,
  activePage: 'params',

  toggleTheme: () =>
    set((state) => {
      const next: ThemeMode = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePage: (page) => set({ activePage: page }),
}));
