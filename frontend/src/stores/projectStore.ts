import { create } from 'zustand';

interface ProjectState {
  // Location & classification
  wilayaCode: string;
  commune: string;
  zone: string;         // derived from wilaya + commune
  site: string;         // "S1" | "S2" | "S3" | "S4"
  group: string;        // "1A" | "1B" | "2" | "3"

  // Project metadata
  projectName: string;
  engineer: string;
  reference: string;
  date: string;

  // Actions
  setWilaya: (code: string) => void;
  setCommune: (commune: string) => void;
  setZone: (zone: string) => void;
  setSite: (site: string) => void;
  setGroup: (group: string) => void;
  setProjectMeta: (meta: Partial<Pick<ProjectState, 'projectName' | 'engineer' | 'reference' | 'date'>>) => void;
  resetProject: () => void;
}

const today = new Date().toISOString().split('T')[0];

const initialState = {
  wilayaCode: '09',
  commune: '',
  zone: 'VI',
  site: 'S2',
  group: '2',
  projectName: '',
  engineer: '',
  reference: '',
  date: today,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  setWilaya: (code) => set({ wilayaCode: code }),
  setCommune: (commune) => set({ commune }),
  setZone: (zone) => set({ zone }),
  setSite: (site) => set({ site }),
  setGroup: (group) => set({ group }),
  setProjectMeta: (meta) => set((state) => ({ ...state, ...meta })),
  resetProject: () => set(initialState),
}));
