"use client";
import React, { useContext, useMemo, useState } from "react";
import Link from "next/link";
import { AppContext } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import PostCard from "@/components/PostCard";
import BackBar from "@/components/BackBar";
import { cardClass } from "@/lib/ui";
import { plural } from "@/lib/format";

const TOPICS = [
  { name: "Работа и карьера", terms: ["работ", "дедлайн", "проект", "стартап", "команд", "собесед", "задач", "встреч"] },
  { name: "Дизайн и UX", terms: ["дизайн", "дизайнер", "макет", "интерфейс", "кнопк", "шрифт", "прототип", "пользоват"] },
  { name: "Технологии", terms: ["модель", "данн", "код", "react", "next", "программ", "баг", "метрик"] },
  { name: "Город и поездки", terms: ["город", "путешеств", "астан", "алмат", "поезд", "прогул", "стран"] },
  { name: "Музыка и культура", terms: ["музык", "трек", "бит", "альбом", "звук", "сэмпл", "книг"] },
];

type ExploreTab = "posts" | "people";

export default function ExplorePage() {
  const {
    ready, posts, users, currentUser, followingIds, followerCounts, isModerator,
    blockedUserIds, blockedByUserIds,
  } = useContext(AppContext);
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [tab, setTab] = useState<ExploreTab>("posts");

  const availablePosts = useMemo(
    () => posts.filter((post) =>
      !blockedUserIds.includes(post.userId) && !blockedByUserIds.includes(post.userId)
    ),
    [posts, blockedUserIds, blockedByUserIds]
  );
  const topics = useMemo(
    () => TOPICS.map((topic) => ({
      ...topic,
      count: availablePosts.filter((post) => {
        const text = `${post.title} ${post.body}`.toLowerCase();
        return topic.terms.some((term) => text.includes(term));
      }).length,
    })).sort((a, b) => b.count - a.count),
    [availablePosts]
  );

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return availablePosts
      .filter((post) => {
        const text = `${post.title} ${post.body}`.toLowerCase();
        const topic = TOPICS.find((item) => item.name === activeTopic);
        const matchesTopic = !topic || topic.terms.some((term) => text.includes(term));
        const author = users[post.userId];
        const matchesQuery =
          !needle ||
          text.includes(needle) ||
          (author && (!post.isAnonymous || isModerator) && author.username.toLowerCase().includes(needle));
        return matchesTopic && matchesQuery;
      })
      .sort((a, b) => (b.likes + b.comments.length * 3) - (a.likes + a.comments.length * 3));
  }, [availablePosts, query, activeTopic, users, isModerator]);

  const filteredPeople = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return Object.values(users)
      .filter((user) =>
        user.id !== currentUser.id &&
        !blockedUserIds.includes(user.id) &&
        !blockedByUserIds.includes(user.id) &&
        (!needle || `${user.username} ${user.firstName} ${user.lastName} ${user.bio}`.toLowerCase().includes(needle))
      )
      .sort((a, b) =>
        (followerCounts[b.id] ?? 0) - (followerCounts[a.id] ?? 0) ||
        a.username.localeCompare(b.username)
      );
  }, [users, currentUser.id, query, followerCounts, blockedUserIds, blockedByUserIds]);

  return (
    <div className={cardClass}>
      <BackBar label="В ленту" />

      <section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-8 text-white dark:border-neutral-800 sm:px-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[32px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-pink-300/20 blur-2xl" />
        <div className="relative">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
          Обзор сообщества
          </span>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Открой новое</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
            Находи интересные истории, следи за темами и знакомься с авторами — даже если их посты пока анонимны.
          </p>
        </div>
      </section>

      <div className="border-b border-gray-200 p-4 dark:border-neutral-800 sm:p-5">
        <label className="relative block">
          <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти пост или автора"
            aria-label="Найти пост или автора"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm text-black outline-none transition focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:bg-black dark:focus:ring-purple-900/30"
          />
        </label>

        <div className="mt-5 flex items-center justify-between gap-3">
          <h2 className="font-bold text-black dark:text-white">Темы сообщества</h2>
          {activeTopic && (
            <button
              onClick={() => setActiveTopic(null)}
              className="text-xs font-semibold text-purple-700 hover:underline dark:text-purple-300"
            >
              Сбросить тему
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {topics.filter((topic) => topic.count > 0).map((topic, index) => (
            <button
              key={topic.name}
              onClick={() => { setActiveTopic(activeTopic === topic.name ? null : topic.name); setTab("posts"); }}
              aria-pressed={activeTopic === topic.name}
              className={`min-w-40 rounded-2xl border p-3 text-left transition ${
                activeTopic === topic.name
                  ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100 dark:bg-purple-900/30 dark:ring-purple-900/40"
                  : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/60 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
              }`}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                Тема {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-1 block whitespace-nowrap text-sm font-bold text-black dark:text-white">{topic.name}</span>
              <span className="mt-1 block text-xs text-gray-500 dark:text-neutral-400">
                {topic.count} {plural(topic.count, ["публикация", "публикации", "публикаций"])}
              </span>
            </button>
          ))}
          {topics.every((topic) => topic.count === 0) && (
            <p className="text-sm text-gray-500 dark:text-neutral-400">Пока нет популярных тем.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-black text-black dark:text-white">
            {activeTopic && tab === "posts" ? activeTopic : tab === "posts" ? "В центре внимания" : "Авторы сообщества"}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
            {tab === "posts" ? "Истории, которые сейчас обсуждают" : "Найди людей со схожими интересами"}
          </p>
        </div>
        <div role="tablist" aria-label="Результаты обзора" className="flex rounded-full bg-gray-100 p-1 dark:bg-neutral-900">
          {([
            ["posts", "Посты"],
            ["people", "Люди"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                tab === id ? "bg-white text-black shadow-sm dark:bg-neutral-700 dark:text-white" : "text-gray-500 dark:text-neutral-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!ready ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-neutral-400">Загружаем рекомендации…</div>
      ) : tab === "posts" ? (
        filteredPosts.length ? (
          filteredPosts.slice(0, 12).map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-gray-500 dark:text-neutral-400">Ничего не нашлось. Попробуй другую тему или запрос.</p>
            {(query || activeTopic) && (
              <button onClick={() => { setQuery(""); setActiveTopic(null); }} className="mt-4 text-sm font-bold text-purple-700 hover:underline dark:text-purple-300">
                Очистить поиск
              </button>
            )}
          </div>
        )
      ) : filteredPeople.length ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {filteredPeople.slice(0, 12).map((user) => (
            <article key={user.id} className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-950/5 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-purple-900">
              <div className="flex items-center gap-3">
                <Link href={`/u/${user.username}`} className="shrink-0">
                  <Avatar src={user.image} sizeClass="w-12 h-12" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${user.username}`} className="block truncate font-bold text-black hover:underline dark:text-white">
                    {user.firstName} {user.lastName}
                  </Link>
                  <span className="block truncate text-xs text-gray-500 dark:text-neutral-400">@{user.username}</span>
                </div>
                {user.verified && <span title="Подтверждённый аккаунт" className="text-sky-500">✓</span>}
              </div>
              <p className="mt-3 min-h-10 line-clamp-2 text-sm text-gray-600 dark:text-neutral-400">
                {user.bio || "Новый участник SecretSpace"}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-neutral-500">
                  {followerCounts[user.id] ?? 0} {plural(followerCounts[user.id] ?? 0, ["подписчик", "подписчика", "подписчиков"])}
                </span>
                <div className="flex gap-2">
                  <Link href={`/messages/${user.username}`} aria-label={`Написать @${user.username}`} title="Написать" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.7 8.7 0 0 1-4-.9L3 21l1.9-5.5a8.4 8.4 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3h.5a8.4 8.4 0 0 1 8 8v.5Z" />
                    </svg>
                  </Link>
                  {!followingIds.includes(user.id) && <FollowButton userId={user.id} />}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-14 text-center text-sm text-gray-500 dark:text-neutral-400">Авторы не найдены.</div>
      )}

      <div className="border-t border-gray-200 bg-gray-50/80 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950">
        <Link href="/new" className="flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-white p-4 transition hover:border-purple-300 dark:border-purple-950 dark:bg-black dark:hover:border-purple-800">
          <div>
            <span className="block text-sm font-bold text-black dark:text-white">Твоя история может стать следующей</span>
            <span className="mt-1 block text-xs text-gray-500 dark:text-neutral-400">Опубликуй мысль и выбери, когда раскрыть автора.</span>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-lg font-black text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">+</span>
        </Link>
      </div>
    </div>
  );
}
