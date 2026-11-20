"use client";
import React, { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import type { Post } from "@/context/AppContext";
import { plural } from "@/lib/format";

export default function RepostButton({ post }: { post: Post }) {
  const { currentUser, toggleRepost } = useContext(AppContext);
  const reposted = post.repostedBy.includes(currentUser.id);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        toggleRepost(post.id);
      }}
      aria-pressed={reposted}
      aria-label={reposted ? "Отменить репост" : "Репостнуть"}
      title={reposted ? "Отменить репост" : "Репостнуть"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm transition-colors ${
        reposted
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-neutral-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
      }`}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m17 2 4 4-4 4" />
        <path d="M3 11V9a3 3 0 0 1 3-3h15" />
        <path d="m7 22-4-4 4-4" />
        <path d="M21 13v2a3 3 0 0 1-3 3H3" />
      </svg>
      <span>{post.repostedBy.length || "Репост"}</span>
      {post.repostedBy.length > 0 && (
        <span className="sr-only">
          {plural(post.repostedBy.length, ["репост", "репоста", "репостов"])}
        </span>
      )}
    </button>
  );
}
