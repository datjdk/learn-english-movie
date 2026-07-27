"use client";

import { useRouter } from "next/navigation";
import { useState, type KeyboardEvent } from "react";
import SearchBar from "@/components/SearchBar";

export default function WatchSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return <SearchBar value={value} onChange={setValue} onKeyDown={handleKeyDown} />;
}
