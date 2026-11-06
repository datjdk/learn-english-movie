import { VIDEOS } from "@/lib/videos";
import { findPoster } from "@/lib/posters";

const CACHE_CONTROL = "public, max-age=86400";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const video = VIDEOS.find((v) => v.id === id);
  if (!video) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const thumbUrl = await findPoster(video);
    return Response.json(
      { thumbUrl },
      { headers: { "Cache-Control": CACHE_CONTROL } }
    );
  } catch {
    return Response.json({ thumbUrl: null }, { status: 502 });
  }
}
