"use client";
import React, { useState, useContext, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppContext, FEED_PREFS_KEY, INTRO_KEY } from "@/context/AppContext";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import { cardClass } from "@/lib/ui";

type Tab = "all" | "anon" | "revealed";
type Sort = "new" | "popular" | "discussed";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "anon", label: "Анонимные" },
  { id: "revealed", label: "Раскрытые" },
];
const SORTS: Sort[] = ["new", "popular", "discussed"];
const PAGE_SIZE = 8;

// Главная страница: лента постов (адрес /)
export default function FeedPage() {
  const { ready, posts, users, isModerator } = useContext(AppContext);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Вкладка и сортировка запоминаются в localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FEED_PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { tab?: Tab; sort?: Sort };
        if (p.tab && TABS.some((t) => t.id === p.tab)) setTab(p.tab);
        if (p.sort && SORTS.includes(p.sort)) setSort(p.sort);
      }
    } catch {}
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    try {
      localStorage.setItem(FEED_PREFS_KEY, JSON.stringify({ tab, sort }));
    } catch {}
  }, [tab, sort, prefsLoaded]);

  // Подсказка «как это работает» показывается один раз
  const [introHidden, setIntroHidden] = useState(true);
  useEffect(() => {
    try {
      setIntroHidden(localStorage.getItem(INTRO_KEY) === "1");
    } catch {
      setIntroHidden(false);
    }
  }, []);
  const hideIntro = () => {
    setIntroHidden(true);
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {}
  };

  const visiblePosts = useMemo(() => {
    let list = posts;
    if (tab === "anon") list = list.filter((p) => p.isAnonymous);
    if (tab === "revealed") list = list.filter((p) => !p.isAnonymous);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const authorVisible = !p.isAnonymous || isModerator;
        return (
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          (authorVisible && users[p.userId]?.username.toLowerCase().includes(q))
        );
      });
    }

    const sorted = [...list];
    if (sort === "new") sorted.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === "popular") sorted.sort((a, b) => b.likes - a.likes);
    if (sort === "discussed") sorted.sort((a, b) => b.comments.length - a.comments.length);
    return sorted;
  }, [posts, tab, query, sort, users, isModerator]);

  const resetFilters = () => {
    setQuery("");
    setTab("all");
    setLimit(PAGE_SIZE);
  };

  const shown = visiblePosts.slice(0, limit);
  const filtered = query || tab !== "all";

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
        <h1 className="text-2xl font-black text-black dark:text-white">Лента</h1>
        <Link
          href="/new"
          className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Создать пост
        </Link>
      </div>

      {ready && !introHidden && (
        <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 bg-purple-50/70 dark:bg-purple-900/10 flex gap-4 items-start">
          <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            <p className="font-bold text-black dark:text-white mb-1">Как работает SecretSpace</p>
            Пишите мысли анонимно и сами выбирайте «цену» раскрытия. Пока пост не наберёт нужное число лайков,
            никто не узнает, кто его автор. Когда лайков хватит, имя и профиль автора откроются.
          </div>
          <button
            onClick={hideIntro}
            className="text-sm font-bold px-4 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black flex-shrink-0"
          >
            Понятно
          </button>
        </div>
      )}

      {/* Поиск, вкладки, сортировка */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-neutral-800 flex flex-col gap-3">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setLimit(PAGE_SIZE); }}
            placeholder="Поиск по постам"
            aria-label="Поиск по постам"
            className="w-full bg-gray-100 dark:bg-neutral-900 border border-transparent focus:border-purple-500 text-black dark:text-white rounded-full py-2 pl-10 pr-4 text-sm outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div role="tablist" className="flex gap-1 bg-gray-100 dark:bg-neutral-900 p-1 rounded-full">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => { setTab(t.id); setLimit(PAGE_SIZE); }}
                className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? "bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
            Сортировка
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-gray-100 dark:bg-neutral-900 text-black dark:text-white rounded-full px-3 py-1.5 text-sm font-semibold outline-none cursor-pointer"
            >
              <option value="new">Новые</option>
              <option value="popular">Популярные</option>
              <option value="discussed">Обсуждаемые</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-col">
        {!ready && (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}
        {ready && shown.map((post) => <PostCard key={post.id} post={post} />)}
        {ready && visiblePosts.length === 0 && (
          <div className="text-center py-16 px-5">
            <p className="text-gray-500 dark:text-neutral-500 mb-4">
              {filtered ? "Ничего не найдено. Попробуйте изменить поиск или фильтр." : "В ленте пока пусто. Опубликуйте первый пост."}
            </p>
            {filtered && (
              <button onClick={resetFilters} className="text-sm font-bold px-5 py-2 rounded-full border border-gray-300 dark:border-neutral-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-900">
                Сбросить фильтры
              </button>
            )}
          </div>
        )}
        {ready && visiblePosts.length > limit && (
          <button
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="py-4 text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors"
          >
            Показать ещё ({visiblePosts.length - limit})
          </button>
        )}
      </div>
      <div className="h-8 bg-gray-50 dark:bg-neutral-900 flex justify-center items-center">
        <div className="w-16 h-1 rounded-full bg-gray-300 dark:bg-neutral-700"></div>
      </div>
    </div>
  );
}
