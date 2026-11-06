"use client";

import Link from "next/link";
import {
  THUMBNAIL_CAPTURE_ENABLED,
  useVideoFrameThumbnail,
} from "@/lib/useVideoFrameThumbnail";
import { usePosterThumbnail } from "@/lib/usePosterThumbnail";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import type { Video } from "@/lib/videos";

export default function SeriesCard({
  serie,
  video,
  episodeCount,
  poster,
  priority,
  portrait = false,
}: {
  serie: string;
  video: Video;
  episodeCount: number;
  /** Poster already resolved on the server; skips the client-side lookup. */
  poster?: string | null;
  priority?: boolean;
  /** 9:16 poster-shaped card instead of the default 16:9. */
  portrait?: boolean;
}) {
  const frameThumbnail = useVideoFrameThumbnail(video.id, video.title, video.src);
  const posterThumbnail = usePosterThumbnail(
    video.id,
    !THUMBNAIL_CAPTURE_ENABLED && poster === undefined
  );
  const thumbnail = frameThumbnail ?? poster ?? posterThumbnail;

  return (
    <Link
      href={`/series/${encodeURIComponent(serie)}`}
      className="group block w-full text-left"
    >
      <div className="relative z-0 overflow-hidden rounded-md shadow-md transition-all duration-300 ease-out group-hover:z-20 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-black/70">
        <VideoThumbnail
          thumbnail={thumbnail}
          thumbColor={video.thumbColor}
          duration={`${episodeCount} episode${episodeCount === 1 ? "" : "s"}`}
          className={`${portrait ? "aspect-[9/16]" : "aspect-video"} w-full !rounded-none`}
          priority={priority}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-2.5 pt-8 pb-2">
          <p className="line-clamp-2 text-sm font-semibold text-white">{serie}</p>
          <p className="mt-0.5 text-xs text-zinc-300">{video.channel}</p>
        </div>
      </div>
    </Link>
  );
}
