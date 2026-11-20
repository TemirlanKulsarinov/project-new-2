"use client";
import React, { useContext } from "react";
import { AppContext, Post } from "@/context/AppContext";

// Кнопка «Сохранить в избранное»
export default function BookmarkButton({ post }: { post: Post }) {
  const { savedIds, toggleBookmark } = useContext(AppContext);
  const saved = savedIds.includes(post.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark(post.id);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Убрать из сохранённого" : "Сохранить пост"}
      title={saved ? "Убрать из сохранённого" : "Сохранить"}
      className={`flex items-center transition-colors ${saved ? "text-amber-500" : "text-gray-500 dark:text-neutral-400 hover:text-amber-500"}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  );
}
