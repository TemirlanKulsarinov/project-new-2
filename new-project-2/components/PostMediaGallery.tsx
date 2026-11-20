"use client";
import React, { useEffect, useState } from "react";
import { loadMediaFile } from "@/lib/mediaStore";
import type { PostMedia } from "@/lib/mediaStore";

export default function PostMediaGallery({ media }: { media: PostMedia[] }) {
  const [sources, setSources] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (media.length === 0) return;
    let cancelled = false;
    let objectUrls: string[] = [];

    Promise.all(media.map((item) => loadMediaFile(item.id).catch(() => null))).then((files) => {
      if (cancelled) return;
      const next: Record<string, string | null> = {};
      files.forEach((file, index) => {
        const id = media[index].id;
        if (file) {
          const url = URL.createObjectURL(file);
          objectUrls.push(url);
          next[id] = url;
        } else {
          next[id] = null;
        }
      });
      setSources(next);
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls = [];
    };
  }, [media]);

  if (media.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3" onClick={(event) => event.stopPropagation()}>
      {media.map((item) => {
        const src = sources[item.id];
        return (
          <figure key={item.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900">
            {src === undefined ? (
              <div className="flex h-40 items-center justify-center text-sm text-gray-400 dark:text-neutral-500">Загружаем медиа…</div>
            ) : src === null ? (
              <div className="flex min-h-24 items-center justify-center px-4 text-center text-sm text-gray-500 dark:text-neutral-400">
                Медиафайл «{item.name}» недоступен на этом устройстве.
              </div>
            ) : item.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={item.name} className="max-h-[520px] w-full bg-black/5 object-contain dark:bg-black/20" />
            ) : item.kind === "video" ? (
              <video src={src} controls playsInline preload="metadata" className="max-h-[520px] w-full bg-black" aria-label={item.name} />
            ) : (
              <div className="p-4">
                <p className="mb-2 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">{item.name}</p>
                <audio src={src} controls preload="metadata" className="w-full" aria-label={item.name} />
              </div>
            )}
          </figure>
        );
      })}
    </div>
  );
}
