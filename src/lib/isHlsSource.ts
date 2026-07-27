export function isHlsSource(src: string): boolean {
  return src.split("?")[0].endsWith(".m3u8");
}
