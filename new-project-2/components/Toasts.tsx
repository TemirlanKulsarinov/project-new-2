"use client";
import React, { useContext } from "react";
import { AppContext } from "@/context/AppContext";

// Короткие уведомления внизу экрана
export default function Toasts() {
  const { toasts } = useContext(AppContext);
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none w-[min(26rem,calc(100vw-2rem))]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast bg-black dark:bg-white text-white dark:text-black text-sm font-semibold px-4 py-2.5 rounded-full shadow-xl text-center"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
