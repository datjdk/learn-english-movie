"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

const VISIBLE_PAGES = 5;

function pageButtonClass(active: boolean) {
  return active
    ? "h-8 w-8 cursor-pointer rounded-full bg-white text-sm font-medium text-black"
    : "h-8 w-8 cursor-pointer rounded-full border border-black/[.15] text-sm font-medium text-black dark:border-white/[.2] dark:text-white";
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  let start = Math.max(1, page - Math.floor(VISIBLE_PAGES / 2));
  const end = Math.min(totalPages, start + VISIBLE_PAGES - 1);
  start = Math.max(1, end - VISIBLE_PAGES + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const showLastPage = end < totalPages;

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="cursor-pointer rounded-full border border-black/[.15] px-4 py-1.5 text-sm font-medium text-black disabled:cursor-default disabled:opacity-40 dark:border-white/[.2] dark:text-white"
        >
          Previous
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={pageButtonClass(p === page)}
          >
            {p}
          </button>
        ))}
        {showLastPage && (
          <>
            <span className="px-1 text-sm text-zinc-400">…</span>
            <button
              type="button"
              onClick={() => onChange(totalPages)}
              className={pageButtonClass(false)}
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="cursor-pointer rounded-full border border-black/[.15] px-4 py-1.5 text-sm font-medium text-black disabled:cursor-default disabled:opacity-40 dark:border-white/[.2] dark:text-white"
        >
          Next
        </button>
      </div>
    </div>
  );
}
