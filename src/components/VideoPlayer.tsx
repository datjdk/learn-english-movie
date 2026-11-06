"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type Hls from "hls.js";
import { isHlsSource } from "@/lib/isHlsSource";
import type { CuesByLang } from "@/lib/useSubtitleCues";

export type SubtitleOption = {
  lang: string;
  label: string;
  src: string;
};

export type VideoPlayerHandle = {
  seekTo: (time: number) => void;
};

type VideoPlayerProps = {
  src: string;
  subtitles?: SubtitleOption[];
  /** Loaded cues per subtitle lang (see useSubtitleCues). */
  cuesByLang: CuesByLang;
  poster?: string;
  controlsExtra?: ReactNode;
  onTimeUpdate?: (time: number) => void;
  activeLang: string;
  onActiveLangChange: (lang: string) => void;
};

export const SUBTITLES_OFF = "off";
export const SUBTITLES_DUAL = "dual";
const OFF = SUBTITLES_OFF;
const DUAL = SUBTITLES_DUAL;
const MAX_CUE_DISPLAY_SECONDS = 3;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function VolumeIcon({
  className,
  muted,
  volume,
}: {
  className?: string;
  muted: boolean;
  volume: number;
}) {
  const silent = muted || volume === 0;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
      {!silent && volume > 0.15 && (
        <path
          d="M15.5 8.5a5 5 0 0 1 0 7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
      {!silent && volume > 0.6 && (
        <path
          d="M18 6a8.5 8.5 0 0 1 0 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
      {silent && (
        <path
          d="M16 9l5 6M21 9l-5 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function FullscreenIcon({ className, active }: { className?: string; active: boolean }) {
  return active ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 4v3a2 2 0 0 1-2 2H4M20 9h-3a2 2 0 0 1-2-2V4M15 20v-3a2 2 0 0 1 2-2h3M4 15h3a2 2 0 0 1 2 2v3" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  {
    src,
    subtitles = [],
    cuesByLang,
    poster,
    controlsExtra,
    onTimeUpdate,
    activeLang,
    onActiveLangChange,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [cueText, setCueText] = useState<Record<string, string>>({});

  const [isPlaying, setIsPlaying] = useState(false);
  // The src that has played at least once; the poster cover shows until then.
  const [startedSrc, setStartedSrc] = useState<string | null>(null);
  const hasStarted = startedSrc === src;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.6);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volumeHover, setVolumeHover] = useState(false);
  const [volumeDragging, setVolumeDragging] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = 0.6;

    let hls: Hls | null = null;

    if (!isHlsSource(src) || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          setError("HLS playback is not supported in this browser.");
          return;
        }
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setError(`Playback error: ${data.details}`);
          }
        });
      });
    }

    return () => {
      hls?.destroy();
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setStartedSrc(src);
    };
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(video.duration || 0);
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [src, onTimeUpdate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = time;
      if (video.paused) video.play();
    },
  }));

  useEffect(() => {
    if (!volumeDragging) return;
    const stop = () => setVolumeDragging(false);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, [volumeDragging]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateCueText = () => {
      const now = video.currentTime;

      setCueText((prev) => {
        let changed = false;
        const next = { ...prev };

        for (const subtitle of subtitles) {
          const cues = cuesByLang[subtitle.lang] ?? [];
          const activeCues = cues.filter(
            (cue) => now >= cue.start && now < cue.end
          );
          const earliestStart = activeCues.length
            ? Math.min(...activeCues.map((cue) => cue.start))
            : null;
          const withinMaxDisplay =
            earliestStart !== null && now - earliestStart <= MAX_CUE_DISPLAY_SECONDS;
          const text = withinMaxDisplay
            ? activeCues.map((cue) => cue.text).join("\n")
            : "";

          if (next[subtitle.lang] !== text) {
            next[subtitle.lang] = text;
            changed = true;
          }
        }

        return changed ? next : prev;
      });
    };

    video.addEventListener("timeupdate", updateCueText);
    video.addEventListener("seeked", updateCueText);
    updateCueText();

    return () => {
      video.removeEventListener("timeupdate", updateCueText);
      video.removeEventListener("seeked", updateCueText);
    };
  }, [subtitles, cuesByLang]);

  const displayedLangs =
    activeLang === DUAL
      ? [...subtitles]
          .sort((a, b) => (a.lang === "en" ? -1 : b.lang === "en" ? 1 : 0))
          .map((subtitle) => subtitle.lang)
      : activeLang !== OFF
      ? [activeLang]
      : [];

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {
        // Not ready yet or blocked by the browser — the user can press again.
      });
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const handleVolumeChange = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const showVolumeSlider = volumeHover || volumeDragging;

  const subtitleButtonClass = (active: boolean) =>
    active
      ? "rounded-full bg-white px-3 py-1 text-xs font-medium text-black"
      : "rounded-full border border-white/30 px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/15";

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-black"
      >
        <video
          ref={videoRef}
          onClick={togglePlay}
          // Keep playback inside the page; iOS Safari otherwise forces
          // fullscreen on play. The player's own fullscreen button still works.
          playsInline
          className="aspect-video w-full"
        />

        {!hasStarted && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play"
            className="group absolute inset-0 flex cursor-pointer items-center justify-center bg-black"
          >
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt=""
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-contain"
              />
            )}
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white ring-2 ring-white/80 backdrop-blur-sm transition-transform duration-150 group-hover:scale-110 group-hover:bg-red-600 sm:h-20 sm:w-20">
              <PlayIcon className="ml-1 h-8 w-8 sm:h-10 sm:w-10" />
            </span>
          </button>
        )}

        {displayedLangs.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-14 flex flex-col items-center gap-1 px-2 sm:bottom-20 sm:gap-1.5 sm:px-4">
            {displayedLangs.map((lang) => {
              const text = cueText[lang];
              if (!text) return null;
              return (
                <span
                  key={lang}
                  className="max-w-[95%] rounded bg-black/50 px-2 py-1 text-center text-sm leading-snug font-normal tracking-wide whitespace-pre-line text-white [text-shadow:0_0_4px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.7),0_2px_2px_rgba(0,0,0,0.9)] [text-wrap:balance] sm:max-w-[90%] sm:rounded-md sm:px-4 sm:py-2 sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl"
                >
                  {text}
                </span>
              );
            })}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-3 pt-6 pb-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="any"
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => handleSeek(Number(e.target.value))}
            aria-label="Seek"
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-red-600"
          />

          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="text-white/90 hover:text-white"
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>

              <span className="text-xs font-medium text-white/90 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex flex-1 items-center justify-center gap-1.5">
              {subtitles.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => onActiveLangChange(OFF)}
                    aria-pressed={activeLang === OFF}
                    className={subtitleButtonClass(activeLang === OFF)}
                  >
                    Off
                  </button>
                  {subtitles.map((subtitle) => (
                    <button
                      key={subtitle.lang}
                      type="button"
                      onClick={() => onActiveLangChange(subtitle.lang)}
                      aria-pressed={activeLang === subtitle.lang}
                      className={subtitleButtonClass(activeLang === subtitle.lang)}
                    >
                      {subtitle.lang.toUpperCase()}
                    </button>
                  ))}
                  {subtitles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onActiveLangChange(DUAL)}
                      aria-pressed={activeLang === DUAL}
                      className={subtitleButtonClass(activeLang === DUAL)}
                    >
                      Dual
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5"
                onMouseEnter={() => setVolumeHover(true)}
                onMouseLeave={() => setVolumeHover(false)}
              >
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="text-white/90 hover:text-white"
                >
                  <VolumeIcon className="h-5 w-5" muted={muted} volume={volume} />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  onMouseDown={() => setVolumeDragging(true)}
                  onTouchStart={() => setVolumeDragging(true)}
                  aria-label="Volume"
                  className={
                    "h-1 cursor-pointer appearance-none rounded-full bg-white/25 accent-red-600 transition-all duration-150 " +
                    (showVolumeSlider ? "w-20 opacity-100" : "w-0 opacity-0")
                  }
                />
              </div>

              {controlsExtra}

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="text-white/90 hover:text-white"
              >
                <FullscreenIcon className="h-5 w-5" active={isFullscreen} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default VideoPlayer;
