// import videosData from "@/lib/videos.json";
import videosData from "@/lib/links.json";

export type Subtitle = {
  lang: string;
  label: string;
  url: string;
};

export type Video = {
  id: string;
  title: string;
  channel: string;
  serie: string;
  duration: string;
  group: string,
  thumbColor: string;
  src?: string;
  poster?: string | null;
  description?: string;
  subtitles?: Subtitle[];
};

export function nextVideos(videos: Video[], currentId: string): Video[] {
  return videos
    .filter((v) => Number(v.id) > Number(currentId))
    .sort((a, b) => Number(a.id) - Number(b.id));
}

export type CatalogItem =
  | { kind: "video"; video: Video }
  | { kind: "serie"; serie: string; video: Video; episodeCount: number };

/**
 * Collapses every video belonging to the same serie into a single catalog
 * entry, keyed off the first (lowest id) episode for its thumbnail/link.
 * Standalone videos (no serie) pass through unchanged.
 */
export function buildCatalog(videos: Video[]): CatalogItem[] {
  const items: CatalogItem[] = [];
  const serieIndex = new Map<string, number>();

  for (const video of videos) {
    if (!video.serie) {
      items.push({ kind: "video", video });
      continue;
    }

    const index = serieIndex.get(video.serie);
    if (index === undefined) {
      serieIndex.set(video.serie, items.length);
      items.push({ kind: "serie", serie: video.serie, video, episodeCount: 1 });
    } else {
      const item = items[index];
      if (item.kind === "serie") item.episodeCount += 1;
    }
  }

  return items;
}

export function matchesCatalogQuery(item: CatalogItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (item.kind === "video") {
    return (
      item.video.title.toLowerCase().includes(q) ||
      item.video.channel.toLowerCase().includes(q)
    );
  }

  return item.serie.toLowerCase().includes(q);
}

// Drop entries missing a title, a video source, or any subtitles.
export const VIDEOS: Video[] = (videosData as Video[]).filter(
  (v) => v.title && v.src && v.subtitles && v.subtitles.length > 0
);
