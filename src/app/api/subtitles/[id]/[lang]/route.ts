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

// The language is a path segment rather than a ?lang= query because CDN
// caches (Netlify's edge, at least) may ignore the query string, which made
// every language share whichever track was cached first.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; lang: string }> }
) {
  const { id, lang } = await params;
  const video = VIDEOS.find((v) => v.id === id);
  const subtitle = video?.subtitles?.find((s) => s.lang === lang);

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
