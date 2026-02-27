export type FeedTier = 1 | 2 | 3 | 4;

export interface FeedDefinition {
  id: string;
  name: string;
  url: string;
  tier: FeedTier;
  region: string;
}

export const FEEDS: FeedDefinition[] = [
  { id: 'reuters-world', name: 'Reuters World', url: 'https://feeds.reuters.com/Reuters/worldNews', tier: 1, region: 'global' },
  { id: 'ap-world', name: 'AP World', url: 'https://apnews.com/hub/world-news/rss', tier: 1, region: 'global' },
  { id: 'bbc-world', name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', tier: 1, region: 'global' },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', tier: 2, region: 'mena' },
  { id: 'dw', name: 'DW World', url: 'https://rss.dw.com/xml/rss-en-world', tier: 2, region: 'europe' },
  { id: 'guardian-world', name: 'Guardian World', url: 'https://www.theguardian.com/world/rss', tier: 2, region: 'global' },
  { id: 'nyt-world', name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', tier: 2, region: 'global' },
  { id: 'npr-world', name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml', tier: 2, region: 'global' },
  { id: 'france24', name: 'France24', url: 'https://www.france24.com/en/rss', tier: 3, region: 'global' },
  { id: 'jpost', name: 'Jerusalem Post', url: 'https://www.jpost.com/rss/rssfeedsheadlines.aspx', tier: 3, region: 'mena' },
  { id: 'dawn', name: 'Dawn', url: 'https://www.dawn.com/feeds/home', tier: 3, region: 'asia' },
  { id: 'hindutimes', name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml', tier: 3, region: 'asia' },
];
