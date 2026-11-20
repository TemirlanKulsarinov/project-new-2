"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppContext, Post } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import LikeButton from "@/components/LikeButton";
import BookmarkButton from "@/components/BookmarkButton";
import RepostButton from "@/components/RepostButton";
import PostMediaGallery from "@/components/PostMediaGallery";
import TimeAgo from "@/components/TimeAgo";

const stop = (e: React.MouseEvent) => e.stopPropagation();

export default function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const { users, currentUser, isModerator, blockedUserIds, blockedByUserIds } = useContext(AppContext);
  const author = users[post.userId];
  const isAnon = post.isAnonymous;
  const isOwn = post.userId === currentUser.id;
  const progress = Math.min(100, Math.round((post.likes / post.revealLikes) * 100));
  const postHref = `/post/${post.id}`;
  const authorHref = `/u/${author.username}`;

  const [justRevealed, setJustRevealed] = useState(false);
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

  if (
    !isModerator &&
    (blockedUserIds.includes(post.userId) || blockedByUserIds.includes(post.userId))
  ) return null;

  return (
    <article
      tabIndex={0}
      onClick={() => router.push(postHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) router.push(postHref);
      }}
      className={`p-5 cursor-pointer flex gap-4 transition-colors border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-900/50 focus-visible:bg-gray-50 dark:focus-visible:bg-neutral-900/50 outline-none bg-white dark:bg-black ${justRevealed ? "animate-reveal" : ""}`}
    >
      <div className="flex-shrink-0 pt-1">
        {isAnon ? (
          <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold border border-gray-300 dark:border-neutral-700 shadow-inner">
            ?
          </div>
        ) : (
          <Link href={authorHref} onClick={stop} aria-label={`Профиль ${author.username}`} className="block rounded-full hover:opacity-80 transition-opacity">
            <Avatar src={author.image} sizeClass="w-11 h-11" />
          </Link>
        )}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1 min-w-0">
          {isAnon ? (
            <span className="font-bold text-[15px] text-gray-500 dark:text-gray-400">Анонимный автор</span>
          ) : (
            <Link
              href={authorHref}
              onClick={stop}
              className="font-bold text-[15px] text-black dark:text-white hover:underline flex items-center gap-1"
            >
              {author.username}
              {author.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
            </Link>
          )}
          <TimeAgo ts={post.createdAt} className="text-sm text-gray-400 dark:text-neutral-500 truncate" />
        </div>

        <h3 className="font-semibold text-[15px] text-black dark:text-white mb-0.5 break-words">
          <Link href={postHref} onClick={stop} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="text-[15px] text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
          {post.body}
        </p>

        <PostMediaGallery media={post.media} />

        {isAnon && (
          <div className="mt-3 max-w-xs" aria-label={`Прогресс раскрытия: ${progress}%`}>
            <div className="h-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 flex-wrap">
          <LikeButton post={post} />

          <Link
            href={postHref}
            onClick={stop}
            aria-label="Комментарии"
            className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.4 8.4 0 01-8.9 8.4 8.6 8.6 0 01-3.6-.8L3 21l1.9-5.1a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 018.5-8.6h.4A8.5 8.5 0 0121 11v.5z" />
            </svg>
            <span className="text-sm font-medium">{post.comments.length}</span>
          </Link>

          <BookmarkButton post={post} />
          <RepostButton post={post} />

          {isAnon && (
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full border border-purple-100 dark:border-purple-800/50">
              До раскрытия: {Math.max(0, post.revealLikes - post.likes)}
            </span>
          )}

          {isAnon && isOwn && (
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 rounded-full border border-sky-100 dark:border-sky-800/50">
              Это ваш пост
            </span>
          )}

          {isAnon && isModerator && !isOwn && (
            <Link
              href={authorHref}
              onClick={stop}
              title="Видно только модератору"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 hover:opacity-80 transition-opacity"
            >
              Автор: @{author.username}
            </Link>
          )}

          {isModerator && post.reports.length > 0 && (
            <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800/60">
              Жалоб: {post.reports.length}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
