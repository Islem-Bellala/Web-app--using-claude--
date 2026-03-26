import { create } from 'zustand';
import type { WilayaInfo, CommuneInfo } from '../types';
import { fetchWilayas as apiFetchWilayas, fetchCommunes as apiFetchCommunes, fetchZone as apiFetchZone } from '../services/api';

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

  // Reference data (fetched from API)
  wilayas: WilayaInfo[];
  communes: CommuneInfo[];
  wilayasLoading: boolean;
  communesLoading: boolean;

  // Actions
  setWilaya: (code: string) => void;
  setCommune: (commune: string) => void;
  setZone: (zone: string) => void;
  setSite: (site: string) => void;
  setGroup: (group: string) => void;
  setProjectMeta: (meta: Partial<Pick<ProjectState, 'projectName' | 'engineer' | 'reference' | 'date'>>) => void;
  resetProject: () => void;

  // Async actions
  fetchWilayas: () => Promise<void>;
  fetchCommunes: (code: string) => Promise<void>;
  deriveZone: (code: string, commune?: string) => Promise<void>;
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
  wilayas: [] as WilayaInfo[],
  communes: [] as CommuneInfo[],
  wilayasLoading: false,
  communesLoading: false,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  setZone: (zone) => set({ zone }),
  setSite: (site) => set({ site }),
  setGroup: (group) => set({ group }),
  setProjectMeta: (meta) => set((state) => ({ ...state, ...meta })),
  resetProject: () => set(initialState),

  // Fetch wilayas list from API
  fetchWilayas: async () => {
    set({ wilayasLoading: true });
    try {
      const wilayas = await apiFetchWilayas();
      set({ wilayas, wilayasLoading: false });
    } catch {
      set({ wilayasLoading: false });
    }
  },

  // Fetch communes for a given wilaya
  fetchCommunes: async (code: string) => {
    set({ communesLoading: true });
    try {
      const communes = await apiFetchCommunes(code);
      set({ communes, communesLoading: false });
    } catch {
      set({ communes: [], communesLoading: false });
    }
  },

  // Derive zone from API
  deriveZone: async (code: string, commune?: string) => {
    try {
      const zone = await apiFetchZone(code, commune);
      set({ zone });
    } catch {
      // leave zone unchanged on error
    }
  },

  // Set wilaya: clears commune/zone, fetches communes if split, derives zone if single
  setWilaya: (code: string) => {
    set({ wilayaCode: code, commune: '', zone: '', communes: [] });
    const { wilayas } = get();
    const wilaya = wilayas.find((w) => w.code === code);
    if (wilaya?.has_split_zones) {
      get().fetchCommunes(code);
    } else {
      get().deriveZone(code);
    }
  },

  // Set commune: auto-derives zone
  setCommune: (commune: string) => {
    set({ commune });
    const { wilayaCode } = get();
    get().deriveZone(wilayaCode, commune);
  },
}));
