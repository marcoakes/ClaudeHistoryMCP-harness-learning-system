export const REFRESH_INTERVAL_MS = 2 * 60 * 1000;
export const WORLD_BRIEF_INTERVAL_MS = 5 * 60 * 1000;
export const MAX_NEWS_ITEMS = 200;

export const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 30,
  high: 18,
  medium: 10,
  low: 5,
  info: 1,
};

export const CATEGORY_WEIGHT: Record<string, number> = {
  conflict: 20,
  terrorism: 20,
  nuclear: 25,
  cyber: 14,
  military: 16,
  political: 10,
  economic: 9,
  disaster: 12,
  health: 8,
  infrastructure: 11,
  social_unrest: 12,
  environment: 8,
  space: 6,
  info: 1,
};
