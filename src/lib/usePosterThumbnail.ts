"use client";

import { useEffect, useState } from "react";

/**
 * Poster thumbnail looked up via /api/posters/[id] (first movieposterdb
 * search result for the video's series or title, year removed). Returns
 * null while loading or when no poster was found — callers should fall
 * back to a placeholder. Pass enabled=false to skip the lookup.
 */
export function usePosterThumbnail(id: string, enabled = true) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetch(`/api/posters/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { thumbUrl?: string | null } | null) => {
        if (!cancelled) setThumbnail(data?.thumbUrl ?? null);
      })
      .catch(() => {
        // No poster available, caller falls back to a placeholder.
      });

    return () => {
      cancelled = true;
    };
  }, [id, enabled]);

  return thumbnail;
}
