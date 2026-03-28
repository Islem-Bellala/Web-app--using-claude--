import { create } from 'zustand';
import type { WilayaInfo, CommuneInfo, ProjectSummary, ProjectState } from '../types';
import {
  fetchWilayas as apiFetchWilayas,
  fetchCommunes as apiFetchCommunes,
  fetchZone as apiFetchZone,
  apiCreateProject,
  apiListProjects,
  apiGetProject,
  apiSaveProjectState,
  apiDeleteProject,
} from '../services/api';

interface ProjectStore {
  // Location & classification
  wilayaCode: string;
  commune: string;
  zone: string;
  site: string;
  group: string;

  // Project metadata (displayed in params form)
  projectName: string;
  engineer: string;
  reference: string;
  date: string;

  // Reference data (fetched from API — NOT persisted)
  wilayas: WilayaInfo[];
  communes: CommuneInfo[];
  wilayasLoading: boolean;
  communesLoading: boolean;

  // Persistence — current open project
  currentProjectId: string | null;
  currentProjectName: string;
  projects: ProjectSummary[];
  isSaving: boolean;

  // Setters
  setWilaya: (code: string) => void;
  setCommune: (commune: string) => void;
  setZone: (zone: string) => void;
  setSite: (site: string) => void;
  setGroup: (group: string) => void;
  setProjectMeta: (meta: Partial<Pick<ProjectStore, 'projectName' | 'engineer' | 'reference' | 'date'>>) => void;
  resetProject: () => void;

  // Async — reference data
  fetchWilayas: () => Promise<void>;
  fetchCommunes: (code: string) => Promise<void>;
  deriveZone: (code: string, commune?: string) => Promise<void>;

  // Persistence
  serializeState: () => ProjectState['project'];
  hydrateState: (state: ProjectState['project']) => void;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
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
  currentProjectId: null as string | null,
  currentProjectName: '',
  projects: [] as ProjectSummary[],
  isSaving: false,
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...initialState,

  setZone: (zone) => set({ zone }),
  setSite: (site) => set({ site }),
  setGroup: (group) => set({ group }),
  setProjectMeta: (meta) => set((state) => ({ ...state, ...meta })),
  resetProject: () => set({
    ...initialState,
    wilayas: get().wilayas,        // keep loaded reference data
    currentProjectId: null,
    currentProjectName: '',
  }),

  // ── Reference data ──────────────────────────────────────────────────────────

  fetchWilayas: async () => {
    set({ wilayasLoading: true });
    try {
      const wilayas = await apiFetchWilayas();
      set({ wilayas, wilayasLoading: false });
    } catch {
      set({ wilayasLoading: false });
    }
  },

  fetchCommunes: async (code: string) => {
    set({ communesLoading: true });
    try {
      const communes = await apiFetchCommunes(code);
      set({ communes, communesLoading: false });
    } catch {
      set({ communes: [], communesLoading: false });
    }
  },

  deriveZone: async (code: string, commune?: string) => {
    try {
      const zone = await apiFetchZone(code, commune);
      set({ zone });
    } catch {
      // leave zone unchanged on error
    }
  },

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

  setCommune: (commune: string) => {
    set({ commune });
    const { wilayaCode } = get();
    get().deriveZone(wilayaCode, commune);
  },

  // ── Serialization ───────────────────────────────────────────────────────────

  serializeState: () => {
    const s = get();
    return {
      wilayaCode: s.wilayaCode,
      commune:    s.commune,
      zone:       s.zone,
      site:       s.site,
      group:      s.group,
      projectName: s.projectName,
      engineer:   s.engineer,
      reference:  s.reference,
      date:       s.date,
    };
  },

  hydrateState: (state) => {
    set({
      wilayaCode:  state.wilayaCode  ?? get().wilayaCode,
      commune:     state.commune     ?? '',
      zone:        state.zone        ?? '',
      site:        state.site        ?? get().site,
      group:       state.group       ?? get().group,
      projectName: state.projectName ?? '',
      engineer:    state.engineer    ?? '',
      reference:   state.reference   ?? '',
      date:        state.date        ?? today,
    });
  },

  // ── Project CRUD ────────────────────────────────────────────────────────────

  fetchProjects: async () => {
    try {
      const projects = await apiListProjects();
      set({ projects });
    } catch {
      // ignore — user stays on project list with stale data
    }
  },

  createProject: async (name, description) => {
    const project = await apiCreateProject(name, description);
    set((s) => ({
      projects: [project, ...s.projects],
      currentProjectId: project.id,
      currentProjectName: project.name,
    }));
  },

  saveCurrentProject: async () => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;

    // Collect state from all stores
    const { useSeismicStore }    = await import('./seismicStore');
    const { useStructuralStore } = await import('./structuralStore');

    const blob: ProjectState = {
      project:    get().serializeState(),
      seismic:    useSeismicStore.getState().serializeState(),
      structural: useStructuralStore.getState().serializeState(),
    };

    set({ isSaving: true });
    try {
      const updated = await apiSaveProjectState(currentProjectId, blob);
      // Refresh the project summary in the list
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === updated.id ? updated : p
        ),
        isSaving: false,
      }));
    } catch {
      set({ isSaving: false });
    }
  },

  loadProject: async (id) => {
    const { useSeismicStore }    = await import('./seismicStore');
    const { useStructuralStore } = await import('./structuralStore');

    const full = await apiGetProject(id);

    // 1. Reset all stores to defaults before hydrating
    useSeismicStore.getState().resetState();
    useStructuralStore.getState().resetState();
    set({
      ...initialState,
      wilayas:            get().wilayas,   // keep loaded reference data
      currentProjectId:   full.id,
      currentProjectName: full.name,
    });

    const state = full.state;
    if (!state) return;  // new/empty project — defaults already applied

    // 2. Hydrate each store from saved state
    if (state.project)    get().hydrateState(state.project);
    if (state.seismic)    useSeismicStore.getState().hydrateState(state.seismic);
    if (state.structural) useStructuralStore.getState().hydrateState(state.structural);

    // 3. Re-derive reference data (communes dropdown + zone)
    const { wilayaCode, wilayas } = get();
    if (wilayaCode) {
      const wilaya = wilayas.find((w) => w.code === wilayaCode);
      if (wilaya?.has_split_zones) {
        await get().fetchCommunes(wilayaCode);
      }
      const { commune } = get();
      await get().deriveZone(wilayaCode, commune || undefined);
    }
  },

  deleteProject: async (id) => {
    await apiDeleteProject(id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      ...(s.currentProjectId === id
        ? { currentProjectId: null, currentProjectName: '' }
        : {}),
    }));
  },
}));
