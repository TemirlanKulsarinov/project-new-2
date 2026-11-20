"use client";
import React, { useContext } from "react";
import { AppContext } from "@/context/AppContext";

export default function FollowButton({ userId }: { userId: number }) {
  const { currentUser, followingIds, toggleFollow } = useContext(AppContext);
  if (userId === currentUser.id) return null;

  const following = followingIds.includes(userId);

  return (
    <button
      type="button"
      onClick={() => toggleFollow(userId)}
      aria-pressed={following}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
        following
          ? "border border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600 dark:border-neutral-700 dark:text-gray-200 dark:hover:border-red-800 dark:hover:text-red-400"
          : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      }`}
    >
      {following ? "Вы подписаны" : "Подписаться"}
    </button>
  );
}
