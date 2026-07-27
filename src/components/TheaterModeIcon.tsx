export default function TheaterModeIcon({
  className,
  active,
}: {
  className?: string;
  active?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity={active ? 0.25 : 0}
      />
    </svg>
  );
}
