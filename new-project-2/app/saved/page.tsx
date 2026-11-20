"use client";
import React, { useContext } from "react";
import Link from "next/link";
import { AppContext } from "@/context/AppContext";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import BackBar from "@/components/BackBar";
import { cardClass } from "@/lib/ui";

// Сохранённые посты текущего аккаунта (адрес /saved)
export default function SavedPage() {
  const { ready, posts, savedIds, currentUser } = useContext(AppContext);

  // Порядок: недавно сохранённые первыми
  const saved = savedIds
    .map((id) => posts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className={cardClass}>
      <BackBar label="В ленту" />
      <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
        <h1 className="text-2xl font-black text-black dark:text-white">Сохранённое</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
          Посты, которые @{currentUser.username} отметил закладкой. У каждого аккаунта свой список.
        </p>
      </div>

      {!ready ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : saved.length === 0 ? (
        <div className="text-center py-16 px-5">
          <p className="text-gray-500 dark:text-neutral-500 mb-4">Пока ничего нет. Нажмите на закладку у поста, чтобы сохранить его.</p>
          <Link href="/" className="inline-block text-sm font-bold px-5 py-2 rounded-full border border-gray-300 dark:border-neutral-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-900">
            Перейти в ленту
          </Link>
        </div>
      ) : (
        saved.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
