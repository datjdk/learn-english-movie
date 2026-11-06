import "server-only";
import type { Video } from "@/lib/videos";

const SEARCH_URL = "https://movieposterdb.com/api/palette/search";
const YEAR_PATTERN = /\s*\(\s*(?:19|20)\d{2}\s*\)/g;
// Give up on a slow upstream rather than holding back the page; the card
// falls back to its placeholder and the next request tries again.
const SEARCH_TIMEOUT_MS = 2000;
// Images requested from another site are 301-redirected from the posters
// host to this embed host; linking to it directly skips that extra hop.
const POSTER_HOST = "posters.movieposterdb.com";
export const POSTER_EMBED_ORIGIN = "https://embed-gate.movieposterdb.com";

function embedUrl(thumbUrl: string) {
  const url = new URL(thumbUrl);
  if (url.host !== POSTER_HOST) return thumbUrl;
  return `${POSTER_EMBED_ORIGIN}${url.pathname}${url.search}`;
}

// Search query -> first result's thumbUrl (null when nothing was found),
// kept for the lifetime of the server process so each title hits the
// upstream API at most once.
const posterCache = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();

function searchQuery(text: string) {
  return text.replace(YEAR_PATTERN, "").replace(/\s+/g, " ").trim();
}

async function searchPoster(query: string): Promise<string | null> {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&locale=en`;
  const res = await fetch(url, {
    headers: { accept: "*/*" },
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });
  // Don't cache upstream failures so a later request can retry.
  if (!res.ok) throw new Error(`Poster search failed: ${res.status}`);

  const data: { movies?: { thumbUrl?: string }[] } = await res.json();
  const first = data.movies?.[0]?.thumbUrl;
  const thumbUrl = first ? embedUrl(first) : null;
  posterCache.set(query, thumbUrl);
  return thumbUrl;
}

/**
 * First movieposterdb search result for the video's serie (or title when it
 * has none), with the release year removed. Throws on upstream failure.
 */
export async function findPoster(video: Video): Promise<string | null> {
  const query = searchQuery(video.serie || video.title);
  if (posterCache.has(query)) return posterCache.get(query) ?? null;

  // Share one in-flight request between concurrent callers.
  let request = pending.get(query);
  if (!request) {
    request = searchPoster(query).finally(() => pending.delete(query));
    pending.set(query, request);
  }
  return request;
}

/** Like findPoster, but resolves to null instead of throwing. */
export function findPosterOrNull(video: Video): Promise<string | null> {
  return findPoster(video).catch(() => null);
}
