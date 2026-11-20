"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext, DRAFT_KEY } from "@/context/AppContext";
import BackBar from "@/components/BackBar";
import { cardClass, inputClass, primaryBtn } from "@/lib/ui";

// Создание поста (адрес /new). Черновик сохраняется в localStorage.
export default function NewPostPage() {
  const router = useRouter();
  const { ready, addPost } = useContext(AppContext);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [revealLikes, setRevealLikes] = useState<number>(5);
  const [draftLoaded, setDraftLoaded] = useState(false);

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const likes = Math.min(100, Math.max(1, Math.floor(revealLikes) || 1));
    if (!title.trim() || !body.trim()) return;
    const id = addPost(title.trim(), body.trim(), likes);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    router.push(`/post/${id}`);
  };

  return (
    <div className={cardClass}>
      <BackBar label="Назад" />
      <form onSubmit={submit} className="p-5 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white">Новый анонимный пост</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            После публикации пост нельзя изменить, его можно только удалить. Черновик сохраняется автоматически.
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
          <button type="submit" disabled={!ready} className={primaryBtn}>Опубликовать</button>
        </div>
      </form>
    </div>
  );
}
