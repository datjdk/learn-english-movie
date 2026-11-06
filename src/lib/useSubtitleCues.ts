"use client";

import { useEffect, useState } from "react";
import type { SubtitleOption } from "@/components/VideoPlayer";
import { parseVtt, type SubtitleCue } from "@/lib/parseVtt";

export type CuesByLang = Record<string, SubtitleCue[]>;

const NO_CUES: CuesByLang = {};

/**
 * Loads every subtitle track once and returns its cues keyed by lang. A lang
 * is missing until its track has loaded, and maps to [] if loading failed.
 * Shared by the player overlay and the transcript so both always show the
 * same language without fetching the same file twice.
 */
export function useSubtitleCues(subtitles: SubtitleOption[]): CuesByLang {
  // Remember which subtitle list the cues belong to, so switching videos
  // never shows the previous video's cues.
  const [loaded, setLoaded] = useState<{ for: SubtitleOption[]; cues: CuesByLang }>({
    for: subtitles,
    cues: NO_CUES,
  });

  useEffect(() => {
    let cancelled = false;

    for (const subtitle of subtitles) {
      fetch(subtitle.src)
        .then((res) => {
          if (!res.ok) throw new Error(`Subtitle request failed: ${res.status}`);
          return res.text();
        })
        .then((text) => parseVtt(text))
        .catch(() => [])
        .then((cues) => {
          if (cancelled) return;
          setLoaded((prev) => ({
            for: subtitles,
            cues: { ...(prev.for === subtitles ? prev.cues : {}), [subtitle.lang]: cues },
          }));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [subtitles]);

  return loaded.for === subtitles ? loaded.cues : NO_CUES;
}
