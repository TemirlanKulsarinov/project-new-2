"use client";
import React, { useContext, useEffect, useState } from "react";
import { AppContext, Post } from "@/context/AppContext";

export default function LikeButton({ post }: { post: Post }) {
  const { currentUser, toggleLike } = useContext(AppContext);
  const isOwn = post.userId === currentUser.id;
  const isLiked = post.likedBy.includes(currentUser.id);
  const [popping, setPopping] = useState(false);

  // Анимация сердечка только в момент клика
  useEffect(() => {
    if (!popping) return;
    const t = setTimeout(() => setPopping(false), 450);
    return () => clearTimeout(t);
  }, [popping]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwn) return;
    if (!isLiked) setPopping(true);
    toggleLike(post.id);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isOwn}
      aria-pressed={isLiked}
      aria-label={isLiked ? "Убрать лайк" : "Поставить лайк"}
      title={isOwn ? "Нельзя лайкать свой пост" : undefined}
      className={`flex items-center gap-1.5 transition-colors group ${isLiked ? "liked" : "text-gray-500 dark:text-neutral-400"} ${popping ? "pop" : ""} ${isOwn ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <svg
        className={`w-5 h-5 transition-colors ${isOwn ? "" : "group-hover:text-red-500"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span className={`text-sm font-medium ${isLiked ? "text-red-500" : ""}`}>{post.likes}</span>
    </button>
  );
}
