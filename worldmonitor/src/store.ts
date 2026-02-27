import { createStore } from 'zustand/vanilla';
import type { CiiEntry, NewsItem, WorldBrief } from './types';

export interface AppState {
  news: NewsItem[];
  cii: CiiEntry[];
  brief: WorldBrief | null;
  selectedRegions: string[];
  loading: boolean;
  lastRefresh: number | null;
  setNews: (news: NewsItem[]) => void;
  setCii: (cii: CiiEntry[]) => void;
  setBrief: (brief: WorldBrief | null) => void;
  setLoading: (loading: boolean) => void;
  setLastRefresh: (ts: number) => void;
}

export const appStore = createStore<AppState>((set) => ({
  news: [],
  cii: [],
  brief: null,
  selectedRegions: ['global'],
  loading: false,
  lastRefresh: null,
  setNews: (news) => set({ news }),
  setCii: (cii) => set({ cii }),
  setBrief: (brief) => set({ brief }),
  setLoading: (loading) => set({ loading }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
}));
