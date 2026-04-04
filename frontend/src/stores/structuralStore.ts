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
  { id: 1, name: 'RDC',     elevation: '3.0',  weight: '1200', dek_x: '', dek_y: '' },
  { id: 2, name: 'Etage 1', elevation: '6.0',  weight: '1100', dek_x: '', dek_y: '' },
  { id: 3, name: 'Etage 2', elevation: '9.0',  weight: '1100', dek_x: '', dek_y: '' },
  { id: 4, name: 'Etage 3', elevation: '12.0', weight: '900',  dek_x: '', dek_y: '' },
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
      dek_x: '',
      dek_y: '',
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
    if (state.stories) {
      // Migration: old projects stored dek_x/dek_y in meters (0.001–0.05 range).
      // New format stores centimeters. Detect by checking if any value is > 0 and < 0.5.
      const stories = state.stories.map(s => ({ dek_x: '', dek_y: '', ...s }))
      const needsMigration = stories.some(s => {
        const x = parseFloat(s.dek_x)
        const y = parseFloat(s.dek_y)
        return (x > 0 && x < 0.5) || (y > 0 && y < 0.5)
      })
      if (needsMigration) {
        set({
          stories: stories.map(s => ({
            ...s,
            dek_x: s.dek_x ? String(parseFloat(s.dek_x) * 100) : '',
            dek_y: s.dek_y ? String(parseFloat(s.dek_y) * 100) : '',
          })),
        })
      } else {
        set({ stories })
      }
    }
  },
}));
