"use client";

import { useRef, useState, type ReactNode } from "react";
import VideoPlayer, {
  SUBTITLES_DUAL,
  SUBTITLES_OFF,
  type SubtitleOption,
  type VideoPlayerHandle,
} from "@/components/VideoPlayer";
import TheaterModeIcon from "@/components/TheaterModeIcon";
import TranscriptPanel from "@/components/TranscriptPanel";
import {
  persistedThumbnailUrl,
  THUMBNAIL_CAPTURE_ENABLED,
} from "@/lib/useVideoFrameThumbnail";

type WatchLayoutProps = {
  title: string;
  src: string;
  /** Poster resolved on the server, shown until playback starts. */
  poster?: string | null;
  subtitles?: SubtitleOption[];
  info: ReactNode;
  comments: ReactNode;
  sidebar: ReactNode;
};

export default function WatchLayout({
  title,
  src,
  poster,
  subtitles,
  info,
  comments,
  sidebar,
}: WatchLayoutProps) {
  const [theater, setTheater] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<VideoPlayerHandle>(null);

  const defaultLang =
    subtitles?.find((subtitle) => subtitle.lang === "en")?.lang ??
    subtitles?.[0]?.lang ??
    SUBTITLES_OFF;
  const [activeLang, setActiveLangState] = useState(defaultLang);
  const [lastLang, setLastLang] = useState(defaultLang);

  const handleActiveLangChange = (next: string) => {
    setActiveLangState(next);
    if (next !== SUBTITLES_OFF && next !== SUBTITLES_DUAL) {
      setLastLang(next);
    }
  };

  const transcriptLang =
    activeLang !== SUBTITLES_OFF && activeLang !== SUBTITLES_DUAL
      ? activeLang
      : lastLang;

  const theaterButton = (
    <button
      type="button"
      onClick={() => setTheater((t) => !t)}
      aria-pressed={theater}
      aria-label="Theater mode"
      className="text-white/90 hover:text-white"
    >
      <TheaterModeIcon className="h-5 w-5" active={theater} />
    </button>
  );

  return (
    <main
      className={
        theater
          ? "mx-auto w-full max-w-none flex-1 px-3 py-4 sm:px-6 sm:py-6"
          : "mx-auto w-full max-w-[1800px] flex-1 px-3 py-4 sm:px-4 sm:py-6"
      }
    >
      <div
        className={
          theater
            ? "flex flex-col gap-6"
            : "flex flex-col gap-6 lg:flex-row lg:items-start"
        }
      >
        <div className={theater ? "w-full" : "min-w-0 lg:flex-1"}>
          <div className={theater ? "mx-auto w-full sm:w-4/5" : undefined}>
            <VideoPlayer
              ref={playerRef}
              src={src}
              subtitles={subtitles}
              poster={
                THUMBNAIL_CAPTURE_ENABLED
                  ? persistedThumbnailUrl(title)
                  : poster ?? undefined
              }
              controlsExtra={theaterButton}
              onTimeUpdate={setCurrentTime}
              activeLang={activeLang}
              onActiveLangChange={handleActiveLangChange}
            />
          </div>

          <div className="lg:hidden">
            <TranscriptPanel
              subtitles={subtitles}
              currentTime={currentTime}
              onSeek={(time) => playerRef.current?.seekTo(time)}
              lang={transcriptLang}
              onLangChange={handleActiveLangChange}
            />
          </div>

          {info}
          {comments}
        </div>

        {!theater && (
          <aside className="w-full shrink-0 lg:w-[380px]">
            <div className="hidden lg:block">
              <TranscriptPanel
                subtitles={subtitles}
                currentTime={currentTime}
                onSeek={(time) => playerRef.current?.seekTo(time)}
                lang={transcriptLang}
                onLangChange={handleActiveLangChange}
              />
            </div>
            {sidebar}
          </aside>
        )}
      </div>

      {theater && (
        <div className="mt-6">
          <div className="hidden lg:block">
            <TranscriptPanel
              subtitles={subtitles}
              currentTime={currentTime}
              onSeek={(time) => playerRef.current?.seekTo(time)}
              lang={transcriptLang}
              onLangChange={handleActiveLangChange}
            />
          </div>
          {sidebar}
        </div>
      )}
    </main>
  );
}
