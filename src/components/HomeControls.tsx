"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";

// The home page is rendered on the server, so each search hits it; wait for
// a pause in typing instead of re-rendering on every keystroke.
const SEARCH_DEBOUNCE_MS = 250;

function homeHref(pathname: string, q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function HomeSearch({ query }: { query: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(query);
  const sentQuery = useRef(query);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Follow URL changes we didn't make ourselves (back/forward, logo link).
  useEffect(() => {
    if (query !== sentQuery.current) {
      sentQuery.current = query;
      setValue(query);
    }
  }, [query]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleChange = (next: string) => {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      sentQuery.current = next;
      startTransition(() => {
        router.replace(homeHref(pathname, next, 1), { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);
  };

  return <SearchBar value={value} onChange={handleChange} />;
}

export function HomePagination({
  query,
  page,
  totalPages,
}: {
  query: string;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onChange={(next) =>
        router.push(homeHref(pathname, query, next), { scroll: false })
      }
    />
  );
}
