import { VIDEOS } from "@/lib/videos";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&amp;/g, "&");
}

function srtToVtt(srt: string): string {
  const body = srt
    .replace(/\r+/g, "")
    .replace(/^﻿/, "")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return `WEBVTT\n\n${body}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = VIDEOS.find((v) => v.id === id);
  const lang = new URL(request.url).searchParams.get("lang");
  const subtitle =
    video?.subtitles?.find((s) => s.lang === lang) ?? video?.subtitles?.[0];

  if (!subtitle) {
    return new Response("Not found", { status: 404 });
  }

  const res = await fetch(subtitle.url);
  if (!res.ok) {
    return new Response("Failed to fetch subtitle", { status: 502 });
  }

  const rawText = await res.text();
  const text = decodeHtmlEntities(rawText);
  const isVtt = /^﻿?WEBVTT/.test(text);
  const vtt = isVtt ? text : srtToVtt(text);
  const filtered = vtt
    .split("\n")
    .filter((line) => !/toomva/i.test(line))
    .map((line) => line.replace(/<\/?[a-zA-Z][^>]*>/g, ""))
    .join("\n");

  return new Response(filtered, {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
