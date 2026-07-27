import Link from "next/link";
import FilmProjectorIcon from "@/components/FilmProjectorIcon";

export default function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 text-[#E50914]">
      <FilmProjectorIcon className="h-8 w-8 drop-shadow-[0_2px_6px_rgba(229,9,20,0.55)]" />
      <span
        className="font-[family-name:var(--font-oswald)] text-lg font-black tracking-normal whitespace-nowrap text-[#E50914] uppercase [text-shadow:1px_1px_0_rgba(0,0,0,0.4)] sm:text-2xl"
      >
        THỊT KHO TÀU
      </span>
    </Link>
  );
}
