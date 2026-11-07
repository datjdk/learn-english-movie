# Handoff — learn-english-movie ("THỊT KHO TÀU")

Status as of 2026-11-07: catalog home page, series/group pages and the watch
page (player + subtitles + transcript) all work, and the app is deployed on
Netlify at **https://thitkhotau.netlify.app** (auto-deploys from `main`).
Latest commit: `6c51fa8 use larger poster`.

## Running it

- No `nvm` on this machine — it uses **fnm**. In PowerShell:
  `fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression; fnm use 24`
  then `npm run dev` (dev) or `npm run build; npm run start` (production).
- On the LAN the app is reachable at `http://172.16.0.2:3000` (used for phone
  testing).
- After a rebuild, open tabs must be **hard-reloaded** (Ctrl+Shift+R): an old
  tab references JS chunks that no longer exist, so buttons silently do
  nothing. This caused one false "play button broken" report.
- Git has no identity configured on this machine. Commit with
  `git -c user.name="Dat Truong" -c user.email="tvtd995a3@gmail.com" commit …`.
  Don't add any Claude/AI attribution to commit messages (user's request).

## Architecture

| Area | Files | Notes |
|---|---|---|
| Content | `src/lib/videos.json` (470 entries), `src/lib/videos.ts` | Single source of truth. Episodes are grouped by `serie`; `buildCatalog()` collapses a series into one card. Server-only — never import it into client components (it was ~220 KB of client JS). |
| Home | `src/app/page.tsx`, `src/components/HomeControls.tsx` | **Server-rendered.** Reads `?q=`/`?page=`, paginates 12 per page, resolves posters on the server, renders 9:16 portrait cards in a 2/3/4/6-column grid. Search (debounced 250 ms) and pagination are small client components that update the URL. |
| Posters | `src/lib/posters.ts`, `src/app/api/posters/[id]/route.ts`, `src/lib/usePosterThumbnail.ts` | Searches `movieposterdb.com/api/palette/search` with `serie \|\| title` minus `(YYYY)`, takes the **first result's** `thumbUrl`, swaps `t_` → `s_` (200×300, ~20 KB) and the host to `embed-gate.movieposterdb.com` (the posters host 301-redirects other-site requests there). In-memory cache per server process, 2 s timeout, de-duplicated in-flight requests; next page is pre-warmed. Cards on series/group pages still look posters up client-side via the API route. |
| Frame thumbnails | `src/lib/useVideoFrameThumbnail.ts`, `src/app/api/thumbnails/[id]/route.ts` | **Disabled** (`THUMBNAIL_CAPTURE_ENABLED = false`). When enabled it grabs a canvas frame from the stream and saves it to `public/thumbnails/` (gitignored). |
| Watch page | `src/app/watch/[id]/page.tsx`, `src/components/WatchLayout.tsx`, `src/components/VideoPlayer.tsx` | Server resolves the poster; player shows it as a cover with a big play button until first play. `playsInline` so iPhones don't force fullscreen. Theater mode, custom controls, Off/VI/EN/Dual subtitle buttons. |
| Subtitles | `src/app/api/subtitles/[id]/[lang]/route.ts`, `src/lib/useSubtitleCues.ts`, `src/lib/parseVtt.ts` | Proxy converts SRT→VTT, decodes entities, strips toomva lines. Unknown lang → 404. `useSubtitleCues` loads every track **once** and shares the cues between the player overlay and the transcript. |
| Transcript | `src/components/TranscriptPanel.tsx` | Follows the player's subtitle selection (no buttons of its own); defaults to EN; with Off/Dual it keeps the last single language. Click a line to seek. |
| Other pages | `src/app/series/[serie]/page.tsx`, `src/app/group/[group]/page.tsx` | 16:9 `VideoCard` grids. |
| Comments | `src/components/CommentSection.tsx` | Stored in the viewer's `localStorage` only. |

## Things that bit us (don't undo these)

- **Subtitle language is a path segment, not `?lang=`.** Netlify's CDN cache
  served one cached track for every `?lang=` value, so VI returned English
  (and vice versa). See commit `85ac533`. Anything cached publicly must vary by
  path, or send `Netlify-Vary: query=…`.
- **`referrer: "no-referrer"` on the watch page** (`metadata` export). toomva's
  HLS host returns 403 when the `Referer` is any site other than localhost —
  this made HLS videos fail on the phone and on Netlify. This deliberately
  sidesteps toomva's hotlink block; they can close it at any time (e.g. signed
  URLs), at which point HLS playback breaks for everyone. MP4 sources aren't
  blocked.
- Poster `object-contain` (not `cover`) — the user wants the full poster, never
  cropped or stretched.

## Performance (Lighthouse mobile, local production build)

Score ~90, first paint 0.8 s, speed index 0.8 s, LCP ~3.7 s (first poster
image from movieposterdb), CLS 0. Before the server-rendering work it was 84
with LCP 4.5 s. The remaining LCP is the third-party image download; serving
posters from our own origin (e.g. `next/image`) would cut it but means
proxying/copying movieposterdb's images.

## Known gaps / ideas

- **Content licensing:** video and subtitle files come from toomva
  (`cloud1/cloud2.toomva.net`, `toomva.com/subs`), which appear to be
  unlicensed mirrors of commercial films; posters come from movieposterdb.
  Fine for personal study, a real problem for a public site.
- "First search result" posters can be wrong for vague titles (e.g. "Remember
  Me", "The Ledge"); some are non-English posters (The Green Mile shows the
  Vietnamese "DẶM XANH" poster). Filtering by year would help.
- Data issues in `videos.json`: typo "The Book theif" (id 447); many entries
  have empty `duration`, `description` and `thumbColor` (a `#292927` fallback
  covers the color).
- The player's fullscreen button uses `requestFullscreen()` on the container,
  which iPhone Safari doesn't support — needs a `webkitEnterFullscreen()`
  fallback on the `<video>`.
- No user-visible error when a stream is blocked or fails (just a black
  player).
- `npm run lint` has pre-existing issues: `CommentSection.tsx`
  (`set-state-in-effect` error), unused `Link` import in
  `series/[serie]/page.tsx`, an unused eslint-disable in `TranscriptPanel.tsx`.
- No test runner. Ad-hoc browser checks were done with puppeteer-core /
  Playwright (WebKit for iPhone emulation) from a scratch directory, not part
  of the repo.
