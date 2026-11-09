"use client";
import React, { useContext, useState, useEffect, useRef } from "react";
import { AppContext, Post } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

interface PostCardProps {
  post: Post;
  onView: (post: Post) => void;
  onProfileClick: (userId: number, e: React.MouseEvent) => void;
}

export default function PostCard({ post, onView, onProfileClick }: PostCardProps) {
  const { users, currentUser, toggleLike } = useContext(AppContext);
  const author = users[post.userId];
  const isAnon = post.isAnonymous;
  const isOwn = post.userId === currentUser.id;
  const isLiked = post.likedBy.includes(currentUser.id);

  const [justRevealed, setJustRevealed] = useState(false);
  const [popping, setPopping] = useState(false);
  const prevAnon = useRef(post.isAnonymous);

  // Подсветка в момент раскрытия автора
  useEffect(() => {
    if (prevAnon.current === true && post.isAnonymous === false) {
      setJustRevealed(true);
      const t = setTimeout(() => setJustRevealed(false), 1500);
      prevAnon.current = post.isAnonymous;
      return () => clearTimeout(t);
    }
    prevAnon.current = post.isAnonymous;
  }, [post.isAnonymous]);

  // Анимация сердечка только в момент клика
  useEffect(() => {
    if (!popping) return;
    const t = setTimeout(() => setPopping(false), 450);
    return () => clearTimeout(t);
  }, [popping]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwn) return;
    if (!isLiked) setPopping(true);
    toggleLike(post.id);
  };

  const heartState = `${isLiked ? "liked" : "text-gray-500 dark:text-neutral-400"} ${popping ? "pop" : ""}`;

  return (
    <div
      className={`p-5 cursor-pointer flex gap-4 transition-colors border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-900/50 bg-white dark:bg-black ${justRevealed ? "animate-reveal" : ""}`}
      onClick={() => onView(post)}
    >
      <div className="flex-shrink-0 pt-1">
        {isAnon ? (
          <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold border border-gray-300 dark:border-neutral-700 shadow-inner">
            ?
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Профиль ${author.username}`}
            className="block rounded-full hover:opacity-80 transition-opacity"
            onClick={(e) => onProfileClick(author.id, e)}
          >
            <Avatar src={author.image} sizeClass="w-11 h-11" />
          </button>
        )}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-baseline gap-2 mb-1.5 min-w-0">
          <span
            className={`font-bold text-[15px] flex items-center gap-1 flex-shrink-0 ${isAnon ? "text-gray-500 dark:text-gray-400" : "text-black dark:text-white hover:underline cursor-pointer"}`}
            onClick={!isAnon ? (e) => onProfileClick(author.id, e) : undefined}
          >
            {isAnon ? "Анонимный автор" : author.username}
            {!isAnon && author.verified && <VerifiedBadge className="w-3.5 h-3.5 self-center" />}
          </span>
          <span className="text-gray-400 dark:text-neutral-500 text-sm truncate">— {post.title}</span>
        </div>

        <p className="text-[15px] text-gray-900 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
          {post.body}
        </p>

        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <button
            onClick={handleLike}
            disabled={isOwn}
            aria-pressed={isLiked}
            aria-label={isLiked ? "Убрать лайк" : "Поставить лайк"}
            title={isOwn ? "Нельзя лайкать свой пост" : undefined}
            className={`flex items-center gap-1.5 transition-colors group ${heartState} ${isOwn ? "cursor-not-allowed opacity-60" : ""}`}
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

          {isAnon && (
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full border border-purple-100 dark:border-purple-800/50">
              До раскрытия лайков: {Math.max(0, post.revealLikes - post.likes)}
            </span>
          )}

          {isAnon && isOwn && (
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 rounded-full border border-sky-100 dark:border-sky-800/50">
              Это ваш пост
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
