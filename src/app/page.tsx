import { preconnect } from "react-dom";
import { redirect } from "next/navigation";
import VideoCard from "@/components/VideoCard";
import SeriesCard from "@/components/SeriesCard";
import Logo from "@/components/Logo";
import { HomePagination, HomeSearch } from "@/components/HomeControls";
import { VIDEOS, buildCatalog, matchesCatalogQuery } from "@/lib/videos";
import { POSTER_EMBED_ORIGIN, findPosterOrNull } from "@/lib/posters";

const PAGE_SIZE = 12;
// Cards above the fold on a phone (first two rows of two columns).
const PRIORITY_CARDS = 4;

const catalog = buildCatalog(VIDEOS);

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  preconnect(POSTER_EMBED_ORIGIN);
  const params = await searchParams;
  const query = firstParam(params.q) ?? "";

  const filtered = catalog.filter((item) => matchesCatalogQuery(item, query));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number(firstParam(params.page)) || 1;
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  if (requestedPage !== page) {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (page > 1) qs.set("page", String(page));
    redirect(qs.size ? `/?${qs}` : "/");
  }

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Resolve posters here so the HTML already carries the image URLs instead
  // of each card looking its poster up after hydration.
  const posters = await Promise.all(
    paginated.map((item) => findPosterOrNull(item.video))
  );
  // Warm the cache for the next page in the background so it renders fast.
  for (const item of filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)) {
    void findPosterOrNull(item.video);
  }

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <header
        className="sticky top-0 z-20 flex flex-col items-center gap-2 border-b border-black/[.08] bg-white/90 px-3 py-3 backdrop-blur-sm sm:flex-row sm:gap-3 sm:px-4 sm:py-4 dark:border-white/[.145] dark:bg-black/90"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <Logo />
        <HomeSearch query={query} />
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
        <h2 className="mb-3 text-xl font-bold text-red-600">
          {query && `${filtered.length} of `}
          {catalog.length} Movies
        </h2>
        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No videos found.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-4 md:grid-cols-4 lg:grid-cols-6">
              {paginated.map((item, i) =>
                item.kind === "serie" ? (
                  <li key={item.serie}>
                    <SeriesCard
                      serie={item.serie}
                      video={item.video}
                      episodeCount={item.episodeCount}
                      poster={posters[i]}
                      priority={i < PRIORITY_CARDS}
                      portrait
                    />
                  </li>
                ) : (
                  <li key={item.video.id}>
                    <VideoCard
                      video={item.video}
                      poster={posters[i]}
                      priority={i < PRIORITY_CARDS}
                      portrait
                    />
                  </li>
                )
              )}
            </ul>
            <HomePagination query={query} page={page} totalPages={totalPages} />
          </>
        )}
      </main>
    </div>
  );
}
