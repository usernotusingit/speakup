import { Newspaper, ExternalLink } from "lucide-react";
import type { NewsFeed as NewsFeedData } from "@/lib/news";

function relativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (!then) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function NewsFeed({ feed }: { feed: NewsFeedData | null }) {
  return (
    <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: "var(--navy-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-indigo-400" />
          <h3 className="text-[var(--text)] font-semibold text-sm">Daily News</h3>
        </div>
        {feed?.updatedAt && (
          <span className="text-[var(--text-faint)] text-xs">
            Updated {relativeTime(feed.updatedAt)}
          </span>
        )}
      </div>

      {!feed || feed.items.length === 0 ? (
        <p className="text-xs text-[var(--text-faint)] italic">
          No news to show right now. Check back soon.
        </p>
      ) : (
        <ul className="space-y-1">
          {feed.items.map((item) => (
            <li key={item.link}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-white/5"
              >
                <span className="mt-0.5 flex-1 text-sm text-[var(--text)] leading-snug group-hover:text-indigo-300">
                  {item.title}
                </span>
                <span className="flex shrink-0 items-center gap-2 pt-0.5">
                  <span className="text-[var(--text-faint)] text-xs whitespace-nowrap">
                    {item.source}
                    {item.pubDate ? ` · ${relativeTime(item.pubDate)}` : ""}
                  </span>
                  <ExternalLink
                    size={13}
                    className="text-[var(--text-faint)] group-hover:text-indigo-400"
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
