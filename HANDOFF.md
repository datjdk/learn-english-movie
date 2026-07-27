# Handoff — Video list & video player pages

Status: index (homepage) page and the watch/video-playing page are functionally
complete for the two real videos. This doc summarizes what's in place and what's
left if picking this up later.

## What was completed

- **Homepage (`src/app/page.tsx`)** — YouTube-style simplified layout: sticky
  search header (filters by title/channel, client-side) + responsive grid of
  `VideoCard`s (`grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
  Empty-state message when search matches nothing.
- **Watch page (`src/app/watch/[id]/page.tsx`)** — dynamic route, YouTube-style
  two-column layout: player + title + channel row on the left, "Up next"
  sidebar (`RelatedVideoRow` list of the other videos) on the right. Calls
  `notFound()` if the id doesn't exist or has no `src`.
- **Video playback (`src/components/VideoPlayer.tsx`)** — supports both HLS
  (`.m3u8` via `hls.js`, dynamically imported, with native fallback for
  Safari) and plain files (`.mp4`) through `isHlsSource()`. Multi-language
  subtitles via a `<select>` that toggles `TextTrack.mode` between
  `showing`/`hidden` rather than relying on the browser's native CC menu.
  Shows a fatal-error message on unrecoverable HLS errors.
- **Subtitle proxy (`src/app/api/subtitles/[id]/route.ts`)** — same-origin
  proxy per video id + `?lang=`, converts `.srt` → WebVTT and decodes HTML
  entities (fixes a real bug where one subtitle source had literal `--&gt;`
  instead of `-->`, silently breaking cue parsing).
- **Thumbnails** — `useVideoFrameThumbnail(id, src, seekSeconds?)`
  (`src/lib/useVideoFrameThumbnail.ts`): checks `public/thumbnails/{id}.jpg`
  via `HEAD` first; if missing, captures a frame client-side (off-screen
  `<video>` + canvas, seeked to `DEFAULT_SEEK_SECONDS` = 1.5min) and persists
  it via `POST /api/thumbnails/{id}` (`src/app/api/thumbnails/[id]/route.ts`,
  validates `id` against `VIDEOS` before writing to disk). Falls back to a
  solid `thumbColor` block (`VideoThumbnail`) if no frame is available (e.g.
  CORS-tainted canvas, or a placeholder video with no `src`).
- **Content model (`src/lib/videos.ts`)** — single `VIDEOS` array is the only
  source of truth, drives both the homepage grid and the dynamic watch/
  subtitle/thumbnail routes. `Video` type: `id, title, channel, duration,
  thumbColor, href?, src?, subtitles?`.
- **CLAUDE.md** — documents the project, commands, architecture, and a
  Workflow rule: don't run dev server/build/lint/browser checks unless
  explicitly asked.

## Key files

| File | Purpose |
|---|---|
| `src/lib/videos.ts` | Content source of truth (`VIDEOS` array, `Video`/`Subtitle` types) |
| `src/app/page.tsx` | Homepage: search + grid |
| `src/app/watch/[id]/page.tsx` | Watch page: player + up-next sidebar |
| `src/components/VideoPlayer.tsx` | HLS/mp4 playback + subtitle language select |
| `src/components/VideoCard.tsx` | Grid card (homepage) |
| `src/components/RelatedVideoRow.tsx` | Sidebar row (watch page) |
| `src/components/VideoThumbnail.tsx` | Shared thumbnail-or-color-block + duration badge |
| `src/lib/useVideoFrameThumbnail.ts` | Thumbnail capture/persistence hook |
| `src/lib/isHlsSource.ts` | `.m3u8` vs. plain-file detection |
| `src/app/api/subtitles/[id]/route.ts` | Subtitle proxy: SRT→VTT + HTML-entity decode |
| `src/app/api/thumbnails/[id]/route.ts` | POST: saves captured frame to `public/thumbnails/{id}.jpg` |

## Known gaps / not done

- **8 placeholder videos** (ids `"1"`–`"8"` in `videos.ts`) have no `src`,
  `href`, or `subtitles` — they render as color blocks only, not clickable,
  no thumbnail capture (hook no-ops without `src`). Only ids `"0"` (Me Before
  You) and `"9"` (Letters to Juliet) are real, playable content.
- Thumbnail persistence (`/api/thumbnails/[id]`) has not been verified
  end-to-end against a running dev server — implemented but unverified per
  the no-unrequested-testing workflow rule.
- No test runner configured in this project.

## Content sources note

Video/subtitle URLs currently point at `toomva.net`/`toomva.com`, which look
like unauthorized mirrors rather than licensed sources. Fine for personal/local
study use as built here, but worth swapping to licensed sources before sharing
or deploying this beyond personal use.
