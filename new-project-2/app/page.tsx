"use client";
import React, { useState, useContext, useEffect, useMemo, useCallback } from "react";
import { AppContext } from "@/context/AppContext";
import PostCard from "@/components/PostCard";
import Background from "@/components/Background";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import ModeratorBadge from "@/components/ModeratorBadge";
import ModerationPanel from "@/components/ModerationPanel";
import { useModal } from "@/lib/useModal";
import { plural } from "@/lib/format";

const inputClass =
  "w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500";
const primaryBtn =
  "bg-black dark:bg-white text-white dark:text-black px-8 py-2.5 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors";
const cardClass =
  "bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm overflow-clip mb-12";

type Tab = "all" | "anon" | "revealed";
type Sort = "new" | "popular" | "discussed";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "anon", label: "Анонимные" },
  { id: "revealed", label: "Раскрытые" },
];

const PAGE_SIZE = 8;
const INTRO_KEY = "secretspace-intro";

function PostSkeleton() {
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

export default function Home() {
  const {
    ready, posts, users, currentUser, isModerator, profileId, moderationOpen,
    openProfile, addPost, updateUser,
  } = useContext(AppContext);

  // Лента: поиск, вкладки, сортировка
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Подсказка «как это работает»
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

  // Модалки
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const closeCreate = useCallback(() => setIsCreateOpen(false), []);
  const closeEditProfile = useCallback(() => setIsEditProfileOpen(false), []);
  useModal(isCreateOpen, closeCreate);
  useModal(isEditProfileOpen, closeEditProfile);

  // Форма поста
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formRevealLikes, setFormRevealLikes] = useState<number>(5);

  // Форма профиля
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formBio, setFormBio] = useState("");

  const profileUser = profileId ? users[profileId] : null;

  /* ---------- Лента ---------- */
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

  /* ---------- Профиль ---------- */
  // Чужие анонимные посты видит только модератор
  const profilePosts = useMemo(
    () =>
      profileId
        ? posts
            .filter((p) => p.userId === profileId && (!p.isAnonymous || p.userId === currentUser.id || isModerator))
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [posts, profileId, currentUser.id, isModerator]
  );
  const profileStats = useMemo(() => {
    if (!profileId) return null;
    const likes = profilePosts.reduce((sum, p) => sum + p.likes, 0);
    const comments = posts.reduce((sum, p) => sum + p.comments.filter((c) => c.userId === profileId).length, 0);
    return { posts: profilePosts.length, likes, comments };
  }, [profileId, profilePosts, posts]);

  /* ---------- Обработчики ---------- */
  const openCreateModal = () => {
    setFormTitle("");
    setFormBody("");
    setFormRevealLikes(5);
    setIsCreateOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const likes = Math.min(100, Math.max(1, Math.floor(formRevealLikes) || 1));
    if (!formTitle.trim() || !formBody.trim()) return;
    addPost(formTitle.trim(), formBody.trim(), likes);
    setIsCreateOpen(false);
    setTab("all");
    setSort("new");
    setQuery("");
  };

  const openEditProfile = () => {
    if (!profileUser) return;
    setFormFirstName(profileUser.firstName);
    setFormLastName(profileUser.lastName);
    setFormBio(profileUser.bio);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !formFirstName.trim() || !formLastName.trim()) return;
    updateUser(profileId, formFirstName.trim(), formLastName.trim(), formBio);
    setIsEditProfileOpen(false);
  };

  const resetFilters = () => {
    setQuery("");
    setTab("all");
    setLimit(PAGE_SIZE);
  };

  const shown = visiblePosts.slice(0, limit);

  return (
    <div className="relative min-h-screen">
      <Background />

      <div className="relative z-10 pt-6">
        {moderationOpen ? (
          <ModerationPanel />
        ) : profileUser && profileStats ? (
          /* ---------- ПРОФИЛЬ ---------- */
          <div className={`${cardClass} min-h-screen`}>
            <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 sticky top-16 z-30 bg-white/90 dark:bg-black/90 backdrop-blur flex justify-between items-center">
              <button
                onClick={() => openProfile(null)}
                className="flex items-center gap-2 text-black dark:text-white font-bold hover:opacity-70 transition"
              >
                ← Назад в ленту
              </button>
              {profileUser.id === currentUser.id && (
                <button
                  onClick={openEditProfile}
                  className="bg-gray-100 dark:bg-neutral-800 text-black dark:text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
                >
                  Редактировать
                </button>
              )}
            </div>

            <div className="p-8 text-center border-b border-gray-200 dark:border-neutral-800">
              <div className="mx-auto mb-4 w-32 h-32">
                <Avatar src={profileUser.image} sizeClass="w-32 h-32" className="border-4 shadow-md" />
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white flex items-center justify-center gap-2">
                {profileUser.firstName} {profileUser.lastName}
                {profileUser.verified && <VerifiedBadge className="w-5 h-5" />}
              </h2>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">@{profileUser.username}</p>
              {profileUser.role === "moderator" && <ModeratorBadge className="mb-4" />}
              <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 max-w-md mx-auto shadow-inner border border-gray-200 dark:border-neutral-800 whitespace-pre-wrap">
                {profileUser.bio || "Пока ничего не рассказал о себе."}
              </div>

              <div className="mt-6 flex justify-center gap-8">
                {[
                  { value: profileStats.posts, label: plural(profileStats.posts, ["пост", "поста", "постов"]) },
                  { value: profileStats.likes, label: plural(profileStats.likes, ["лайк", "лайка", "лайков"]) },
                  { value: profileStats.comments, label: plural(profileStats.comments, ["комментарий", "комментария", "комментариев"]) },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-xl font-black text-black dark:text-white">{s.value}</div>
                    <div className="text-xs text-gray-500 dark:text-neutral-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">
              Посты пользователя
            </h3>
            <div className="flex flex-col pb-6">
              {profilePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {profilePosts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-neutral-500 py-10">Нет доступных постов.</p>
              )}
            </div>
          </div>
        ) : (
          /* ---------- ЛЕНТА ---------- */
          <div className={cardClass}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
              <h1 className="text-2xl font-black text-black dark:text-white">Лента</h1>
              <button
                onClick={openCreateModal}
                disabled={!ready}
                className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Создать пост
              </button>
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
                    {query || tab !== "all" ? "Ничего не найдено. Попробуйте изменить поиск или фильтр." : "В ленте пока пусто. Опубликуйте первый пост."}
                  </p>
                  {(query || tab !== "all") && (
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
        )}
      </div>

      {/* МОДАЛКА: СОЗДАНИЕ ПОСТА */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeCreate}>
          <div
            role="dialog" aria-modal="true" aria-label="Новый пост"
            className="modal-panel bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h2 className="font-bold text-lg">Новый анонимный пост</h2>
              <button onClick={closeCreate} aria-label="Закрыть" className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <input
                type="text" placeholder="Заголовок" value={formTitle} maxLength={80}
                onChange={(e) => setFormTitle(e.target.value)} required autoFocus
                className={`${inputClass} font-medium`}
              />
              <div>
                <textarea
                  placeholder="Что у вас нового?" value={formBody} maxLength={600}
                  onChange={(e) => setFormBody(e.target.value)} required
                  className={`${inputClass} min-h-[120px] resize-none`}
                />
                <div className="text-right text-xs text-gray-400 dark:text-neutral-500 mt-1">{formBody.length}/600</div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/50">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">Лайков для раскрытия:</span>
                  <input
                    type="number" min="1" max="100" value={formRevealLikes}
                    onChange={(e) => setFormRevealLikes(Number(e.target.value))} required
                    className="w-20 bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-700 text-black dark:text-white rounded-lg p-1.5 text-center outline-none focus:ring-2 focus:ring-purple-400 font-bold"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  {[3, 5, 10, 25].map((n) => (
                    <button
                      key={n} type="button" onClick={() => setFormRevealLikes(n)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                        formRevealLikes === n
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
                <button type="submit" className={primaryBtn}>Опубликовать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: РЕДАКТИРОВАНИЕ ПРОФИЛЯ */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeEditProfile}>
          <div
            role="dialog" aria-modal="true" aria-label="Редактировать профиль"
            className="modal-panel bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h2 className="font-bold text-lg">Редактировать профиль</h2>
              <button onClick={closeEditProfile} aria-label="Закрыть" className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="ep-first">Имя</label>
                  <input id="ep-first" type="text" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} required maxLength={30} className={`${inputClass} font-medium`} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="ep-last">Фамилия</label>
                  <input id="ep-last" type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} required maxLength={30} className={`${inputClass} font-medium`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="ep-bio">О себе</label>
                <textarea id="ep-bio" value={formBio} onChange={(e) => setFormBio(e.target.value)} maxLength={200} className={`${inputClass} min-h-[100px] resize-none`} />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className={primaryBtn}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}