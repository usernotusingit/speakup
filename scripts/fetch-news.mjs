#!/usr/bin/env node
// Fetches "lighter" culture & science headlines from BBC RSS feeds and caches
// them to data/news.json for the dashboard Daily News card.
//
// Run twice a day via cron:
//   0 11,21 * * * cd /root/.prod/speakup && /usr/bin/node scripts/fetch-news.mjs
//
// Zero dependencies — uses Node's global fetch (Node 18+) and a small regex
// parser. Fault tolerant: if a feed fails or nothing parses, the existing
// cache is left untouched rather than blanked.

import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";

const FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science" },
  { url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", source: "BBC Culture" },
];

const MAX_ITEMS = 8;
const OUT_PATH = path.join(process.cwd(), "data", "news.json");

function decodeEntities(str) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function field(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function parseItems(xml, source) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const title = field(block, "title");
    const link = field(block, "link");
    const pubDate = field(block, "pubDate");
    if (title && link) {
      items.push({ title, link, source, pubDate });
    }
  }
  return items;
}

async function fetchFeed({ url, source }) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "SpeakUpEnglish/1.0 (dashboard news feed)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseItems(xml, source);
  } catch (err) {
    console.error(`[fetch-news] ${source} failed: ${err.message}`);
    return [];
  }
}

async function main() {
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const all = results.flat();

  // Dedupe by link, sort newest first, cap.
  const seen = new Set();
  const deduped = all.filter((it) => {
    if (seen.has(it.link)) return false;
    seen.add(it.link);
    return true;
  });
  deduped.sort((a, b) => {
    const ta = Date.parse(a.pubDate) || 0;
    const tb = Date.parse(b.pubDate) || 0;
    return tb - ta;
  });
  const items = deduped.slice(0, MAX_ITEMS);

  if (items.length === 0) {
    console.error("[fetch-news] no items parsed — keeping existing cache");
    process.exitCode = 1;
    return;
  }

  const payload = { updatedAt: new Date().toISOString(), items };
  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + "\n");
  console.log(`[fetch-news] wrote ${items.length} items to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("[fetch-news] fatal:", err);
  process.exitCode = 1;
});
