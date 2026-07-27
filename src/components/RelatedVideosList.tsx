"use client";

import { useState } from "react";
import RelatedVideoRow from "@/components/RelatedVideoRow";
import Pagination from "@/components/Pagination";
import type { Video } from "@/lib/videos";

const PAGE_SIZE = 10;

export default function RelatedVideosList({ videos }: { videos: Video[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(videos.length / PAGE_SIZE));
  const paginated = videos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="flex flex-col gap-3">
        {paginated.map((video) => (
          <RelatedVideoRow key={video.id} video={video} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
