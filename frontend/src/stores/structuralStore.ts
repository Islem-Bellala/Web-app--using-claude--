import { create } from 'zustand';
import type { Story } from '../types/project';

interface StructuralState {
  stories: Story[];

  // Actions
  addStory: () => void;
  removeStory: (id: number) => void;
  updateStory: (id: number, field: keyof Story, value: string | number) => void;
  setStories: (stories: Story[]) => void;
  resetStories: () => void;
  resetState: () => void;
  serializeState: () => { stories: Story[] };
  hydrateState: (state: { stories?: Story[] }) => void;
}

const DEFAULT_STORIES: Story[] = [
  { id: 1, name: 'RDC',     elevation: '3.0',  weight: '1200', drx: '', dry: '' },
  { id: 2, name: 'Etage 1', elevation: '6.0',  weight: '1100', drx: '', dry: '' },
  { id: 3, name: 'Etage 2', elevation: '9.0',  weight: '1100', drx: '', dry: '' },
  { id: 4, name: 'Etage 3', elevation: '12.0', weight: '900',  drx: '', dry: '' },
];

export const useStructuralStore = create<StructuralState>((set, get) => ({
  stories: DEFAULT_STORIES,

  addStory: () => {
    const stories = get().stories;
    const last = stories[stories.length - 1];
    const lastElev = parseFloat(last?.elevation) || 0;
    const step = stories.length >= 2
      ? parseFloat(last.elevation) - parseFloat(stories[stories.length - 2].elevation)
      : 3.0;
    const newStory: Story = {
      id: Date.now(),
      name: `Etage ${stories.length}`,
      elevation: (lastElev + step).toFixed(1),
      weight: last?.weight || '1000',
      drx: '',
      dry: '',
    };
    set({ stories: [...stories, newStory] });
  },

  removeStory: (id) => {
    const stories = get().stories;
    if (stories.length <= 1) return;
    set({ stories: stories.filter((s) => s.id !== id) });
  },

  updateStory: (id, field, value) => {
    set({
      stories: get().stories.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  },

  setStories: (stories) => set({ stories }),

  resetStories: () => set({ stories: DEFAULT_STORIES }),
  resetState: () => set({ stories: DEFAULT_STORIES }),

  serializeState: () => ({ stories: get().stories }),

  hydrateState: (state) => {
    if (state.stories) set({ stories: state.stories });
  },
}));
