import { preconnect } from "react-dom";
import { notFound } from "next/navigation";
import Link from "next/link";
import RelatedVideosList from "@/components/RelatedVideosList";
import CommentSection from "@/components/CommentSection";
import WatchLayout from "@/components/WatchLayout";
import Logo from "@/components/Logo";
import WatchSearchBar from "@/components/WatchSearchBar";
import { VIDEOS, nextVideos } from "@/lib/videos";
import { POSTER_EMBED_ORIGIN, findPosterOrNull } from "@/lib/posters";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = VIDEOS.find((v) => v.id === id);

  if (!video?.src) notFound();

  const related = nextVideos(VIDEOS, id);
  preconnect(POSTER_EMBED_ORIGIN);
  const poster = await findPosterOrNull(video);

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <header className="sticky top-0 z-10 flex flex-col items-center gap-2 border-b border-black/[.08] bg-white/90 px-3 py-3 backdrop-blur-sm sm:flex-row sm:gap-3 sm:px-4 sm:py-4 dark:border-white/[.145] dark:bg-black/90">
        <Logo />
        <WatchSearchBar />
      </header>

      <WatchLayout
        title={video.title}
        src={video.src}
        poster={poster}
        subtitles={video.subtitles?.map((s) => ({
          lang: s.lang,
          label: s.label,
          src: `/api/subtitles/${video.id}?lang=${s.lang}`,
        }))}
        info={
          <>
            <h1 className="mt-3 text-xl font-semibold text-black dark:text-zinc-50">
              {video.title}
            </h1>

            {video.description && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {video.description}
              </p>
            )}

            <div className="mt-3 flex items-center gap-3 border-b border-black/[.08] pb-4 dark:border-white/[.145]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {video.channel.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-zinc-50">
                  {video.channel}
                </p>
                {(video.serie || video.group) && (
                  <div className="flex items-center gap-1.5 text-sm font-normal">
                    {video.serie && (
                      <Link
                        href={`/series/${encodeURIComponent(video.serie)}`}
                        className="text-black hover:underline dark:text-white"
                      >
                        {video.serie}
                      </Link>
                    )}
                    {video.serie && video.group && (
                      <span className="font-semibold text-zinc-500 dark:text-zinc-300">
                        ›
                      </span>
                    )}
                    {video.group && (
                      <Link
                        href={`/group/${encodeURIComponent(video.group)}`}
                        className="text-black hover:underline dark:text-white"
                      >
                        {video.group}
                      </Link>
                    )}
                  </div>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {video.duration}
                </p>
              </div>
            </div>
          </>
        }
        comments={<CommentSection videoId={video.id} />}
        sidebar={
          <>
            <h2 className="mb-3 text-sm font-semibold text-black dark:text-zinc-50">
              Up next
            </h2>
            <RelatedVideosList videos={related} />
          </>
        }
      />
    </div>
  );
}
