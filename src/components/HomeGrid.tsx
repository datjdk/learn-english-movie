"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import VideoCard from "@/components/VideoCard";
import SeriesCard from "@/components/SeriesCard";
import type { CatalogEntry, CatalogPage } from "@/lib/catalogPage";
import { subtitleTrackUrl } from "@/lib/subtitleUrl";

// Cards above the fold on a phone (first two rows of two columns).
const PRIORITY_CARDS = 4;
// Start loading the next page a little before the end of the list shows.
const LOAD_AHEAD_MARGIN = "600px";
// Keep "Loading more…" up at least this long so new cards don't pop in
// abruptly.
const MIN_LOADING_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Subtitle URLs already requested on this page load, shared across searches.
const prefetchedSubtitles = new Set<string>();

/**
 * Loads a card's subtitle tracks into the HTTP cache (and the CDN's) so the
 * watch page's transcript shows straight away. A serie card prefetches its
 * first episode, which is the one its link leads to first.
 */
function prefetchSubtitles(entries: CatalogEntry[]) {
  for (const { item } of entries) {
    for (const subtitle of item.video.subtitles ?? []) {
      const url = subtitleTrackUrl(item.video.id, subtitle.lang);
      if (prefetchedSubtitles.has(url)) continue;
      prefetchedSubtitles.add(url);
      // Read the body so the response is stored in full.
      fetch(url, { priority: "low" })
        .then((res) => res.text())
        .catch(() => prefetchedSubtitles.delete(url));
    }
  }
}

/**
 * Home catalog grid that loads further pages from /api/catalog as the user
 * scrolls. Render it with key={query} so a new search starts from page 1.
 */
export default function HomeGrid({
  query,
  initialEntries,
  initialHasMore,
}: {
  query: string;
  initialEntries: CatalogEntry[];
  initialHasMore: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const nextPage = useRef(2);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setFailed(false);

    try {
      const params = new URLSearchParams({ page: String(nextPage.current) });
      if (query) params.set("q", query);
      const [data] = await Promise.all([
        fetch(`/api/catalog?${params}`).then((res) => {
          if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);
          return res.json() as Promise<CatalogPage>;
        }),
        delay(MIN_LOADING_MS),
      ]);
      nextPage.current += 1;
      setEntries((prev) => [...prev, ...data.entries]);
      setHasMore(data.hasMore);
    } catch {
      setFailed(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    prefetchSubtitles(entries);
  }, [entries]);

  // Re-observe after every page: if the sentinel is still on screen (tall
  // window, short page) the fresh observer fires again and loads the next.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || failed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: LOAD_AHEAD_MARGIN }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, failed, loadMore, entries.length]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-4 md:grid-cols-4 lg:grid-cols-6">
        {entries.map(({ item, poster }, i) =>
          item.kind === "serie" ? (
            <li key={item.serie}>
              <SeriesCard
                serie={item.serie}
                video={item.video}
                episodeCount={item.episodeCount}
                poster={poster}
                priority={i < PRIORITY_CARDS}
                portrait
              />
            </li>
          ) : (
            <li key={item.video.id}>
              <VideoCard
                video={item.video}
                poster={poster}
                priority={i < PRIORITY_CARDS}
                portrait
              />
            </li>
          )
        )}
      </ul>

      {hasMore && <div ref={sentinelRef} aria-hidden className="h-px" />}

      {loading && (
        <div role="status" className="mt-6 flex justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-red-600 dark:border-zinc-700 dark:border-t-red-600" />
          <span className="sr-only">Loading more…</span>
        </div>
      )}
      {failed && (
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Couldn&apos;t load more.{" "}
          <button
            type="button"
            onClick={loadMore}
            className="font-semibold text-red-600 hover:underline"
          >
            Try again
          </button>
        </p>
      )}
    </>
  );
}
