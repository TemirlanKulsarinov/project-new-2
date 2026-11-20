import React from "react";

// Заглушка, пока данные загружаются из localStorage
export default function PostSkeleton() {
  return (
    <div className="p-5 flex gap-4 border-b border-gray-200 dark:border-neutral-800">
      <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-800 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-neutral-800 animate-pulse" />
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-neutral-800 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-neutral-800 animate-pulse" />
      </div>
    </div>
  );
}
