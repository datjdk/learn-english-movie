// Kept out of videos.ts so client components can import it without pulling
// the whole video catalog (links.json) into the browser bundle.

/** Same-origin URL the player loads a subtitle track from. */
export function subtitleTrackUrl(videoId: string, lang: string) {
  return `/api/subtitles/${videoId}/${lang}`;
}
