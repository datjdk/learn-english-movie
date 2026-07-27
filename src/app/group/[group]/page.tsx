import { notFound } from "next/navigation";
import VideoCard from "@/components/VideoCard";
import Logo from "@/components/Logo";
import { VIDEOS } from "@/lib/videos";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  const groupName = decodeURIComponent(group);
  const videos = VIDEOS.filter((v) => v.group === groupName).sort(
    (a, b) => Number(a.id) - Number(b.id)
  );

  if (videos.length === 0) notFound();

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <header className="sticky top-0 z-10 flex items-center border-b border-black/[.08] bg-white/90 px-3 py-3 backdrop-blur-sm sm:px-4 dark:border-white/[.145] dark:bg-black/90">
        <Logo />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
        <h1 className="mb-4 text-lg font-semibold text-red-600 dark:text-red-500">
          {groupName}
        </h1>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          {videos.length} video{videos.length === 1 ? "" : "s"}
        </p>
        <ul className="grid grid-cols-1 gap-x-3 gap-y-3 xs:grid-cols-2 sm:gap-x-4 sm:gap-y-4 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <li key={video.id}>
              <VideoCard video={video} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
