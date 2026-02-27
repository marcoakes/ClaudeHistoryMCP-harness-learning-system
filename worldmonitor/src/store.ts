import { createStore } from 'zustand/vanilla';
import type { CiiEntry, FeedHealthEntry, NewsItem, WorldBrief } from './types';

export interface AppState {
  news: NewsItem[];
  cii: CiiEntry[];
  brief: WorldBrief | null;
  feedHealth: FeedHealthEntry[];
  selectedRegions: string[];
  loading: boolean;
  lastRefresh: number | null;
  setNews: (news: NewsItem[]) => void;
  setCii: (cii: CiiEntry[]) => void;
  setBrief: (brief: WorldBrief | null) => void;
  setFeedHealth: (feedHealth: FeedHealthEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setLastRefresh: (ts: number) => void;
}

export const appStore = createStore<AppState>((set) => ({
  news: [],
  cii: [],
  brief: null,
  feedHealth: [],
  selectedRegions: ['global'],
  loading: false,
  lastRefresh: null,
  setNews: (news) => set({ news }),
  setCii: (cii) => set({ cii }),
  setBrief: (brief) => set({ brief }),
  setFeedHealth: (feedHealth) => set({ feedHealth }),
  setLoading: (loading) => set({ loading }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
}));
