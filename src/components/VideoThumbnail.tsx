export function VideoThumbnail({
  thumbnail,
  thumbColor,
  duration,
  className = "",
}: {
  thumbnail?: string | null;
  thumbColor: string;
  duration: string;
  className?: string;
}) {
  if (thumbnail) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnail} alt="" className="h-full w-full object-cover" />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {duration}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl ${className}`}
      style={{ backgroundColor: thumbColor }}
    >
      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
        {duration}
      </span>
    </div>
  );
}
