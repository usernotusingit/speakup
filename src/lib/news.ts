import { readFile } from "node:fs/promises";
import path from "node:path";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

export interface NewsFeed {
  updatedAt: string;
  items: NewsItem[];
}

const NEWS_PATH = path.join(process.cwd(), "data", "news.json");

/**
 * Reads the cached news feed from disk at request time. Returns null if the
 * cache is missing or unreadable (e.g. before the first cron run) so callers
 * can render a graceful empty state. The file is refreshed twice a day by
 * scripts/fetch-news.mjs.
 */
export async function getNews(): Promise<NewsFeed | null> {
  try {
    const raw = await readFile(NEWS_PATH, "utf8");
    const data = JSON.parse(raw) as NewsFeed;
    if (!Array.isArray(data.items)) return null;
    return data;
  } catch {
    return null;
  }
}
