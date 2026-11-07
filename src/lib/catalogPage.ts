import "server-only";
import {
  VIDEOS,
  buildCatalog,
  matchesCatalogQuery,
  type CatalogItem,
} from "@/lib/videos";
import { findPosterOrNull } from "@/lib/posters";

const PAGE_SIZE = 12;

const catalog = buildCatalog(VIDEOS);

export const CATALOG_SIZE = catalog.length;

export type CatalogEntry = { item: CatalogItem; poster: string | null };

export type CatalogPage = {
  entries: CatalogEntry[];
  /** Number of catalog items matching the query, across all pages. */
  total: number;
  hasMore: boolean;
};

/**
 * One page of the home catalog with posters already resolved, so cards
 * render their images straight away instead of looking them up after
 * hydration.
 */
export async function getCatalogPage(
  query: string,
  page: number
): Promise<CatalogPage> {
  const filtered = catalog.filter((item) => matchesCatalogQuery(item, query));
  const start = (page - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);
  const posters = await Promise.all(
    items.map((item) => findPosterOrNull(item.video))
  );

  // Warm the cache for the next page in the background so it loads fast.
  for (const item of filtered.slice(start + PAGE_SIZE, start + 2 * PAGE_SIZE)) {
    void findPosterOrNull(item.video);
  }

  return {
    entries: items.map((item, i) => ({ item, poster: posters[i] })),
    total: filtered.length,
    hasMore: start + PAGE_SIZE < filtered.length,
  };
}
