"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";

// The home page is rendered on the server, so each search hits it; wait for
// a pause in typing instead of re-rendering on every keystroke.
const SEARCH_DEBOUNCE_MS = 250;

function homeHref(pathname: string, q: string) {
  return q ? `${pathname}?${new URLSearchParams({ q })}` : pathname;
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
        router.replace(homeHref(pathname, next), { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);
  };

  return <SearchBar value={value} onChange={handleChange} />;
}
