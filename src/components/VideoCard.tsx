"use client";

import Link from "next/link";
import { useVideoFrameThumbnail } from "@/lib/useVideoFrameThumbnail";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import type { Video } from "@/lib/videos";

export default function VideoCard({ video }: { video: Video }) {
  const thumbnail = useVideoFrameThumbnail(video.id, video.title, video.src);

  const content = (
    <div className="relative z-0 overflow-hidden rounded-md shadow-md transition-all duration-300 ease-out group-hover:z-20 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-black/70">
      <VideoThumbnail
        thumbnail={thumbnail}
        thumbColor={video.thumbColor}
        duration={video.duration}
        className="aspect-video w-full !rounded-none"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-2.5 pt-8 pb-2">
        <p className="line-clamp-2 text-sm font-semibold text-white">
          {video.title}
        </p>
        <p className="mt-0.5 text-xs text-zinc-300">{video.channel}</p>
      </div>
    </div>
  );

  return video.src ? (
    <Link href={`/watch/${video.id}`} className="group block w-full text-left">
      {content}
    </Link>
  ) : (
    <button type="button" className="group block w-full text-left">
      {content}
    </button>
  );
}
