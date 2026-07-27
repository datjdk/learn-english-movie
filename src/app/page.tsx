"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import VideoCard from "@/components/VideoCard";
import SeriesCard from "@/components/SeriesCard";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import Logo from "@/components/Logo";
import { VIDEOS, buildCatalog, matchesCatalogQuery } from "@/lib/videos";

const PAGE_SIZE = 12;

function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const updateHeight = () => setHeaderHeight(el.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const catalog = useMemo(() => buildCatalog(VIDEOS), []);
  const filtered = useMemo(
    () => catalog.filter((item) => matchesCatalogQuery(item, query)),
    [catalog, query]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number(searchParams.get("page")) || 1;
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const navigate = useCallback(
    (updates: { q?: string; page?: number }, mode: "push" | "replace") => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.q !== undefined) {
        if (updates.q) params.set("q", updates.q);
        else params.delete("q");
      }
      if (updates.page !== undefined) {
        if (updates.page <= 1) params.delete("page");
        else params.set("page", String(updates.page));
      }

      const qs = params.toString();
      router[mode](qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (requestedPage !== page) {
      navigate({ page }, "replace");
    }
  }, [requestedPage, page, navigate]);

  const handleQueryChange = (value: string) => {
    navigate({ q: value, page: 1 }, "replace");
  };

  const handlePageChange = (nextPage: number) => {
    navigate({ page: nextPage }, "push");
  };

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-20 flex flex-col items-center gap-2 border-b border-black/[.08] bg-white/90 px-3 py-3 backdrop-blur-sm sm:flex-row sm:gap-3 sm:px-4 sm:py-4 dark:border-white/[.145] dark:bg-black/90"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <Logo />
        <SearchBar value={query} onChange={handleQueryChange} />
      </header>

      <main
        className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-4 sm:py-6"
        style={{ marginTop: headerHeight }}
      >
        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No videos found.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-4 xs:grid-cols-2 sm:gap-x-5 sm:gap-y-5 lg:grid-cols-3">
              {paginated.map((item) =>
                item.kind === "serie" ? (
                  <li key={item.serie}>
                    <SeriesCard
                      serie={item.serie}
                      video={item.video}
                      episodeCount={item.episodeCount}
                    />
                  </li>
                ) : (
                  <li key={item.video.id}>
                    <VideoCard video={item.video} />
                  </li>
                )
              )}
            </ul>
            <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
          </>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
