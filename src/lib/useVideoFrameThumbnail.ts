"use client";

import { useEffect, useState } from "react";
import type Hls from "hls.js";
import { isHlsSource } from "@/lib/isHlsSource";
import { slugify } from "@/lib/slugify";

export function persistedThumbnailUrl(title: string) {
  return `/thumbnails/${slugify(title)}.jpg`;
}

const DEFAULT_SEEK_SECONDS = 4.5 * 60;
const THUMBNAIL_MAX_WIDTH = 640;
const THUMBNAIL_MAX_HEIGHT = 320;
const THUMBNAIL_QUALITY = 0.5;

/**
 * Best-effort thumbnail: reuses a frame previously saved to
 * public/thumbnails/{slugified-title}.jpg if one exists. Otherwise grabs a
 * frame from the HLS/video stream via canvas (downscaled to at most
 * 640x320) and persists it there via the /api/thumbnails/[id] route so the
 * next load skips capture entirely. Returns null (and stays null) if
 * there's no saved frame and capture fails (e.g. a CORS-tainted canvas) —
 * callers should fall back to a placeholder in that case.
 */
export function useVideoFrameThumbnail(
  id: string,
  title: string,
  src: string | undefined,
  seekSeconds = DEFAULT_SEEK_SECONDS
) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    const videoSrc = src;

    let cancelled = false;
    let hls: Hls | null = null;
    let video: HTMLVideoElement | null = null;

    const cleanup = () => {
      hls?.destroy();
      video?.removeAttribute("src");
      video?.load();
    };

    function persist(dataUrl: string) {
      fetch(`/api/thumbnails/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      }).catch(() => {
        // Best-effort persistence — the in-memory thumbnail is already
        // showing regardless of whether saving it succeeds.
      });
    }

    function capture() {
      if (!video) return;
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(
          1,
          THUMBNAIL_MAX_WIDTH / video.videoWidth,
          THUMBNAIL_MAX_HEIGHT / video.videoHeight
        );
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx || canvas.width === 0 || canvas.height === 0) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", THUMBNAIL_QUALITY);
        if (cancelled) return;
        setThumbnail(dataUrl);
        persist(dataUrl);
      } catch {
        // Tainted canvas (no CORS on the CDN) or another capture failure —
        // no thumbnail available, caller falls back to a placeholder.
      } finally {
        cleanup();
      }
    }

    function captureFromStream() {
      video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      video.addEventListener("loadedmetadata", () => {
        if (!video) return;
        const clamped = Math.min(seekSeconds, Math.max(video.duration - 1, 0));
        if (Number.isFinite(clamped) && clamped > 0) {
          video.currentTime = clamped;
        } else {
          capture();
        }
      });
      video.addEventListener("seeked", capture);

      if (!isHlsSource(videoSrc) || video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoSrc;
      } else {
        import("hls.js").then(({ default: HlsCtor }) => {
          if (cancelled || !video) return;
          if (!HlsCtor.isSupported()) return;
          hls = new HlsCtor();
          hls.loadSource(videoSrc);
          hls.attachMedia(video);
        });
      }
    }

    fetch(persistedThumbnailUrl(title), { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setThumbnail(persistedThumbnailUrl(title));
        } else {
          captureFromStream();
        }
      })
      .catch(() => {
        if (!cancelled) captureFromStream();
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [id, title, src, seekSeconds]);

  return thumbnail;
}
