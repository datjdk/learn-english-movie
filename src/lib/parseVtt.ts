export type SubtitleCue = {
  start: number;
  end: number;
  text: string;
};

export function parseVtt(vttText: string): SubtitleCue[] {
  const timeRe =
    /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;
  const toSeconds = (h: string, m: string, s: string, ms: string) =>
    Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;

  const cues: SubtitleCue[] = [];
  const blocks = vttText.replace(/\r/g, "").split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) continue;

    const match = lines[timeLineIndex].match(timeRe);
    if (!match) continue;

    const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = match;
    const text = lines.slice(timeLineIndex + 1).join("\n").trim();
    if (!text) continue;

    cues.push({
      start: toSeconds(h1, m1, s1, ms1),
      end: toSeconds(h2, m2, s2, ms2),
      text,
    });
  }

  return cues;
}
