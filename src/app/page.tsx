import { preconnect } from "react-dom";
import Logo from "@/components/Logo";
import HomeGrid from "@/components/HomeGrid";
import { HomeSearch } from "@/components/HomeControls";
import { CATALOG_SIZE, getCatalogPage } from "@/lib/catalogPage";
import { POSTER_EMBED_ORIGIN } from "@/lib/posters";

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

  // The first page ships with the HTML; HomeGrid fetches the rest on scroll.
  const firstPage = await getCatalogPage(query, 1);

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
          {query && `${firstPage.total} of `}
          {CATALOG_SIZE} Movies
        </h2>
        {firstPage.total === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No videos found.
          </p>
        ) : (
          <HomeGrid
            key={query}
            query={query}
            initialEntries={firstPage.entries}
            initialHasMore={firstPage.hasMore}
          />
        )}
      </main>
    </div>
  );
}
