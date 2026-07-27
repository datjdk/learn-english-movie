"use client";

import { useEffect, useState, type FormEvent } from "react";

type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

const DEFAULT_AUTHOR = "You";

function storageKey(videoId: string) {
  return `comments:${videoId}`;
}

function loadComments(videoId: string): Comment[] {
  try {
    const raw = localStorage.getItem(storageKey(videoId));
    return raw ? (JSON.parse(raw) as Comment[]) : [];
  } catch {
    return [];
  }
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CommentSection({ videoId }: { videoId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    setComments(loadComments(videoId));
  }, [videoId]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const comment: Comment = {
      id: crypto.randomUUID(),
      author: DEFAULT_AUTHOR,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    const next = [comment, ...comments];
    setComments(next);
    localStorage.setItem(storageKey(videoId), JSON.stringify(next));
    setText("");
  }

  function handleDelete(id: string) {
    const next = comments.filter((c) => c.id !== id);
    setComments(next);
    localStorage.setItem(storageKey(videoId), JSON.stringify(next));
  }

  return (
    <div className="mt-6">
      <h2 className="mb-4 text-sm font-semibold text-black dark:text-zinc-50">
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h2>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {DEFAULT_AUTHOR.charAt(0)}
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            rows={1}
            className="w-full resize-none border-b border-black/[.15] bg-transparent py-1 text-sm text-black outline-none focus:border-black/40 dark:border-white/[.2] dark:text-white dark:focus:border-white/40"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setText("")}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-500 hover:bg-black/[.05] dark:text-zinc-400 dark:hover:bg-white/[.08]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black disabled:opacity-40"
            >
              Comment
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {comment.author.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-black dark:text-zinc-50">
                  {comment.author}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatTimestamp(comment.createdAt)}
                </p>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-black dark:text-zinc-100">
                {comment.text}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(comment.id)}
                className="mt-1 text-xs text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
