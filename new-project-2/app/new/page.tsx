"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext, DRAFT_KEY } from "@/context/AppContext";
import { saveMediaFiles } from "@/lib/mediaStore";
import type { PostMedia } from "@/lib/mediaStore";
import BackBar from "@/components/BackBar";
import { cardClass, inputClass, primaryBtn } from "@/lib/ui";

const MAX_MEDIA_FILES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

function PendingMediaPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const frame = requestAnimationFrame(() => setSrc(url));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const size = file.size < 1024 * 1024
    ? `${Math.max(1, Math.round(file.size / 1024))} КБ`
    : `${(file.size / (1024 * 1024)).toFixed(1)} МБ`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      {src && file.type.startsWith("image/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={file.name} className="h-36 w-full object-cover" />
      ) : src && file.type.startsWith("video/") ? (
        <video src={src} controls playsInline className="h-36 w-full bg-black object-contain" />
      ) : file.type.startsWith("audio/") && src ? (
        <div className="p-3">
          <p className="mb-2 truncate text-xs font-semibold text-gray-600 dark:text-gray-300">{file.name}</p>
          <audio src={src} controls preload="metadata" className="w-full" />
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center px-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
          {file.type.startsWith("audio/") ? "Аудио" : "Файл"} · {file.name}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 p-2">
        <span className="min-w-0 truncate text-xs text-gray-500 dark:text-neutral-400">{file.name} · {size}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Удалить ${file.name}`}
          className="shrink-0 rounded-full px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

// Создание поста (адрес /new). Черновик сохраняется в localStorage.
export default function NewPostPage() {
  const router = useRouter();
  const { ready, addPost } = useContext(AppContext);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [revealLikes, setRevealLikes] = useState<number>(5);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { title?: string; body?: string; revealLikes?: number };
        setTitle(d.title ?? "");
        setBody(d.body ?? "");
        if (typeof d.revealLikes === "number") setRevealLikes(d.revealLikes);
      }
    } catch {}
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    try {
      if (!title && !body) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body, revealLikes }));
    } catch {}
  }, [title, body, revealLikes, draftLoaded]);

  const addMediaFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;
    const next = [...mediaFiles, ...selected];
    if (next.length > MAX_MEDIA_FILES) {
      setMediaError(`Можно добавить не более ${MAX_MEDIA_FILES} файлов.`);
      return;
    }
    if (selected.some((file) => !/^(image|video|audio)\//.test(file.type))) {
      setMediaError("Поддерживаются только фото, видео и аудио.");
      return;
    }
    if (selected.some((file) => file.size > MAX_FILE_SIZE) || next.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) {
      setMediaError("Размер одного файла — до 25 МБ, общий размер вложений — до 50 МБ.");
      return;
    }
    setMediaError("");
    setMediaFiles(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const likes = Math.min(100, Math.max(1, Math.floor(revealLikes) || 1));
    if (!title.trim() || !body.trim() || publishing) return;
    setPublishing(true);
    setMediaError("");
    try {
      const media: PostMedia[] = await saveMediaFiles(mediaFiles);
      const id = addPost(title.trim(), body.trim(), likes, media);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      router.push(`/post/${id}`);
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Не удалось сохранить вложения. Попробуйте ещё раз.");
      setPublishing(false);
    }
  };

  return (
    <div className={cardClass}>
      <BackBar label="Назад" />
      <form onSubmit={submit} className="p-5 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white">Новый анонимный пост</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            После публикации пост нельзя изменить, его можно только удалить. Текстовый черновик сохраняется автоматически, медиа добавляется к публикации.
          </p>
        </div>

        <input
          type="text" placeholder="Заголовок" value={title} maxLength={80}
          onChange={(e) => setTitle(e.target.value)} required autoFocus
          className={`${inputClass} font-medium`}
        />
        <div>
          <textarea
            placeholder="Что у вас нового?" value={body} maxLength={600}
            onChange={(e) => setBody(e.target.value)} required
            className={`${inputClass} min-h-[160px] resize-none`}
          />
          <div className="text-right text-xs text-gray-400 dark:text-neutral-500 mt-1">{body.length}/600</div>
        </div>

        <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-black dark:text-white">Медиа к публикации</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">Фото, видео или аудио · до 5 файлов · хранятся на этом устройстве</p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Медиа может раскрыть автора: проверьте, нет ли в кадре личных данных.</p>
            </div>
            <label className="cursor-pointer rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 transition hover:border-purple-400 hover:text-purple-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-200 dark:hover:text-purple-300">
              Добавить медиа
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                multiple
                onChange={addMediaFiles}
                className="sr-only"
                aria-label="Добавить фото, видео или аудио"
              />
            </label>
          </div>
          {mediaFiles.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {mediaFiles.map((file, index) => (
                <PendingMediaPreview
                  key={`${file.name}-${file.lastModified}-${index}`}
                  file={file}
                  onRemove={() => setMediaFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                />
              ))}
            </div>
          )}
          {mediaError && <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{mediaError}</p>}
        </section>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">Лайков для раскрытия:</span>
            <input
              type="number" min="1" max="100" value={revealLikes}
              onChange={(e) => setRevealLikes(Number(e.target.value))} required
              className="w-20 bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-700 text-black dark:text-white rounded-lg p-1.5 text-center outline-none focus:ring-2 focus:ring-purple-400 font-bold"
            />
          </div>
          <div className="flex gap-2 mt-3">
            {[3, 5, 10, 25].map((n) => (
              <button
                key={n} type="button" onClick={() => setRevealLikes(n)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  revealLikes === n
                    ? "bg-purple-600 text-white border-purple-600"
                    : "border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-3">
            Чем больше число, тем дольше вы останетесь анонимным. Свои лайки не считаются.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={!ready || publishing} className={primaryBtn}>
            {publishing ? "Сохраняем…" : "Опубликовать"}
          </button>
        </div>
      </form>
    </div>
  );
}
