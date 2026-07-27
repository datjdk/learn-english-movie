import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { VIDEOS } from "@/lib/videos";
import { slugify } from "@/lib/slugify";

const THUMBNAILS_DIR = path.join(process.cwd(), "public", "thumbnails");
const DATA_URL_PATTERN = /^data:image\/jpeg;base64,(.+)$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const video = VIDEOS.find((v) => v.id === id);
  if (!video) {
    return new Response("Not found", { status: 404 });
  }

  const { dataUrl } = await request.json();
  const match = typeof dataUrl === "string" ? DATA_URL_PATTERN.exec(dataUrl) : null;
  if (!match) {
    return new Response("Invalid image data", { status: 400 });
  }

  const filename = `${slugify(video.title)}.jpg`;
  await mkdir(THUMBNAILS_DIR, { recursive: true });
  await writeFile(path.join(THUMBNAILS_DIR, filename), Buffer.from(match[1], "base64"));

  return new Response(null, { status: 204 });
}
