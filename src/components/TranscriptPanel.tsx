"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SubtitleOption } from "@/components/VideoPlayer";
import type { SubtitleCue as TranscriptCue } from "@/lib/parseVtt";

const NO_CUES: TranscriptCue[] = [];

type TranscriptPanelProps = {
  subtitles?: SubtitleOption[];
  /** Cues for `lang`, shared with the player; undefined while loading. */
  cues?: TranscriptCue[];
  currentTime: number;
  onSeek: (time: number) => void;
  lang: string;
  onLangChange: (lang: string) => void;
};

function formatTimestamp(seconds: number): string {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TranscriptPanel({
  subtitles = [],
  cues: loadedCues,
  currentTime,
  onSeek,
  lang,
  onLangChange,
}: TranscriptPanelProps) {
  const loading = loadedCues === undefined;
  const cues = loadedCues ?? NO_CUES;
  const [userScrolling, setUserScrolling] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleManualScroll = () => {
    setUserScrolling(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setUserScrolling(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  const activeIndex = useMemo(
    () => cues.findIndex((cue) => currentTime >= cue.start && currentTime < cue.end),
    [cues, currentTime]
  );

  const isSearching = query.trim() !== "";

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cues
      .map((cue, index) => ({ cue, index }))
      .filter(({ cue }) => !q || cue.text.toLowerCase().includes(q));
  }, [cues, query]);

  const scrollToLine = (index: number) => {
    const container = containerRef.current;
    const line = lineRefs.current[index];
    if (!container || !line) return;

    const relativeTop = line.offsetTop - container.offsetTop;
    const isMobile = window.innerWidth < 640;
    const target = isMobile
      ? relativeTop - 8
      : relativeTop - container.clientHeight / 2 + line.clientHeight / 2;
    container.scrollTo({ top: target, behavior: "smooth" });
  };

  useEffect(() => {
    if (activeIndex < 0 || userScrolling || isSearching || collapsed) return;
    scrollToLine(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, userScrolling, isSearching, collapsed]);

  const handleSelectLine = (cue: TranscriptCue, index: number) => {
    onSeek(cue.start);
    onLangChange(lang);
    setQuery("");
    requestAnimationFrame(() => scrollToLine(index));
  };

  if (subtitles.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-black/[.08] dark:border-white/[.145]">
      <div className="flex items-center justify-between gap-2 border-b border-black/[.08] px-3 py-2 dark:border-white/[.145]">
        <h2 className="text-sm font-semibold text-black dark:text-white">
          Transcript
        </h2>
        {/* Language follows the subtitle selection on the player. */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="rounded-full border border-black/[.15] px-2.5 py-0.5 text-xs font-medium text-black hover:bg-black/[.05] dark:border-white/[.2] dark:text-white dark:hover:bg-white/[.08]"
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      {!collapsed && (
      <>
      <div className="border-b border-black/[.08] p-2 dark:border-white/[.145]">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript"
            className="w-full rounded-md border border-black/[.15] bg-transparent px-2.5 py-1.5 pr-7 text-sm text-black outline-none placeholder:text-zinc-400 focus:border-black/40 dark:border-white/[.2] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white/40"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-black dark:text-zinc-500 dark:hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        onWheel={handleManualScroll}
        onTouchMove={handleManualScroll}
        className="max-h-[260px] overflow-y-auto p-2 sm:max-h-[420px]"
      >
        {cues.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {loading ? "Loading transcript..." : "Transcript unavailable."}
          </p>
        ) : filteredEntries.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No matches.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filteredEntries.map(({ cue, index }) => {
              const active = index === activeIndex;
              return (
                <li key={`${cue.start}-${index}`}>
                  <button
                    type="button"
                    ref={(el) => {
                      lineRefs.current[index] = el;
                    }}
                    onClick={() => handleSelectLine(cue, index)}
                    className={
                      "flex w-full gap-3 rounded-lg border-l-2 px-2 py-1.5 text-left text-sm transition-colors " +
                      (active
                        ? "border-red-500 bg-red-500/10 font-medium text-zinc-900 shadow-[inset_3px_0_10px_-4px_rgba(239,68,68,0.8)] dark:bg-red-500/[.12] dark:text-white"
                        : "border-transparent text-zinc-700 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.06]")
                    }
                  >
                    <span className="shrink-0 tabular-nums text-zinc-400 dark:text-zinc-500">
                      {formatTimestamp(cue.start)}
                    </span>
                    <span className="whitespace-pre-line">{cue.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </>
      )}
    </div>
  );
}
