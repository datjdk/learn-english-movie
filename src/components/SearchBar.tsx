"use client";

import type { KeyboardEvent } from "react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
};

export default function SearchBar({ value, onChange, onKeyDown }: SearchBarProps) {
  return (
    <div className="flex w-full justify-center sm:flex-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search videos"
        className="w-full max-w-xl rounded-full border border-black/[.15] bg-zinc-50 px-4 py-2.5 text-base text-black outline-none focus:border-black/40 sm:px-5 sm:text-sm dark:border-white/[.2] dark:bg-zinc-900 dark:text-white dark:focus:border-white/40"
      />
    </div>
  );
}
