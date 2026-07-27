"use client";

import Link from "next/link";
import { useVideoFrameThumbnail } from "@/lib/useVideoFrameThumbnail";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import type { Video } from "@/lib/videos";

export default function RelatedVideoRow({ video }: { video: Video }) {
  const thumbnail = useVideoFrameThumbnail(video.id, video.title, video.src);

  const content = (
    <div className="flex gap-2">
      <VideoThumbnail
        thumbnail={thumbnail}
        thumbColor={video.thumbColor}
        duration={video.duration}
        className="aspect-video w-40 flex-shrink-0 shadow-none transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-black/40"
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-black dark:text-zinc-50">
          {video.title}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {video.channel}
        </p>
      </div>
    </div>
  );

  if (!video.src) {
    return <div className="opacity-60">{content}</div>;
  }

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group -m-1.5 block rounded-lg p-1.5 transition-colors duration-200 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
    >
      {content}
    </Link>
  );
}
