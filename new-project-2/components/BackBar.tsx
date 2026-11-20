"use client";
import React from "react";
import { useRouter } from "next/navigation";

// Липкая панель «Назад» вверху страницы-карточки
export default function BackBar({
  children,
  fallback = "/",
  label = "Назад",
}: {
  children?: React.ReactNode;
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  };

  return (
    <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 sticky top-16 z-30 bg-white/90 dark:bg-black/90 backdrop-blur flex justify-between items-center gap-3">
      <button onClick={goBack} className="flex items-center gap-2 text-black dark:text-white font-bold hover:opacity-70 transition">
        ← {label}
      </button>
      {children}
    </div>
  );
}
