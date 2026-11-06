const DEFAULT_THUMB_COLOR = "#292927";

export function VideoThumbnail({
  thumbnail,
  thumbColor,
  duration,
  className = "",
  priority = false,
}: {
  thumbnail?: string | null;
  thumbColor: string;
  duration: string;
  className?: string;
  /** Load eagerly at high priority — use for cards visible on first paint. */
  priority?: boolean;
}) {
  if (thumbnail) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="h-full w-full object-contain"
        />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {duration}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl ${className}`}
      style={{ backgroundColor: thumbColor || DEFAULT_THUMB_COLOR }}
    >
      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
        {duration}
      </span>
    </div>
  );
}
