"use client";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { AppContext, Post } from "@/context/AppContext";
import PostCard from "@/components/PostCard";
import Background from "@/components/Background";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

const inputClass =
  "w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 disabled:opacity-70";
const primaryBtn =
  "bg-black dark:bg-white text-white dark:text-black px-8 py-2.5 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors";

export default function Home() {
  const { posts, users, currentUser, profileId, openProfile, addPost, updatePost, deletePost, updateUser } =
    useContext(AppContext);

  // Состояния модалок
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Форма поста
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formRevealLikes, setFormRevealLikes] = useState<number>(5);

  // Форма профиля
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formBio, setFormBio] = useState("");

  const anyModalOpen = isCreateOpen || !!activePost || isEditProfileOpen;

  // Escape закрывает модалки, фон под ними не прокручивается
  useEffect(() => {
    if (!anyModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCreateOpen(false);
        setActivePost(null);
        setIsEditProfileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [anyModalOpen]);

  const profileUser = profileId ? users[profileId] : null;

  // Посты профиля: чужие анонимные не показываются
  const profilePosts = useMemo(
    () =>
      profileId
        ? posts.filter((p) => p.userId === profileId && (!p.isAnonymous || p.userId === currentUser.id))
        : [],
    [posts, profileId, currentUser.id]
  );

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
  };

  const openViewModal = (post: Post) => {
    setActivePost(post);
    setFormTitle(post.title);
    setFormBody(post.body);
  };

  const handleSavePost = () => {
    if (!activePost || !formTitle.trim() || !formBody.trim()) return;
    updatePost(activePost.id, formTitle.trim(), formBody.trim());
    setActivePost(null);
  };

  const openProfileTab = (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    openProfile(userId);
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

  const canEditActive = !!activePost && activePost.userId === currentUser.id;

  return (
    <div className="relative min-h-screen">
      <Background />

      <div className="relative z-10 pt-6">
        {profileUser ? (
          /* ВКЛАДКА ПРОФИЛЯ */
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm overflow-hidden mb-12 min-h-screen">
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
              {/* Аватар показывается целиком: рисунок масштабирован внутри круга */}
              <div className="mx-auto mb-4 w-32 h-32">
                <Avatar
                  src={profileUser.image}
                  sizeClass="w-32 h-32"
                  className="border-4 shadow-md"
                />
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white flex items-center justify-center gap-2">
                {profileUser.firstName} {profileUser.lastName}
                {profileUser.verified && <VerifiedBadge className="w-5 h-5" />}
              </h2>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4">@{profileUser.username}</p>
              <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 max-w-md mx-auto shadow-inner border border-gray-200 dark:border-neutral-800 whitespace-pre-wrap">
                {profileUser.bio || "Пока ничего не рассказал о себе."}
              </div>
            </div>

            <h3 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">
              Посты пользователя
            </h3>
            <div className="flex flex-col pb-6">
              {profilePosts.map((post) => (
                <PostCard key={post.id} post={post} onView={openViewModal} onProfileClick={openProfileTab} />
              ))}
              {profilePosts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-neutral-500 py-10">Нет доступных постов.</p>
              )}
            </div>
          </div>
        ) : (
          /* ЛЕНТА */
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm overflow-hidden mb-12">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
              <h2 className="text-2xl font-black text-black dark:text-white">Лента</h2>
              <button
                onClick={openCreateModal}
                className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Создать пост
              </button>
            </div>
            <div className="flex flex-col">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onView={openViewModal} onProfileClick={openProfileTab} />
              ))}
              {posts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-neutral-500 py-16">
                  В ленте пока пусто. Опубликуйте первый пост.
                </p>
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsCreateOpen(false)}>
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h3 className="font-bold text-lg">Новый анонимный пост</h3>
              <button onClick={() => setIsCreateOpen(false)} aria-label="Закрыть" className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <input
                type="text" placeholder="Заголовок" value={formTitle} maxLength={80}
                onChange={(e) => setFormTitle(e.target.value)} required autoFocus
                className={`${inputClass} font-medium`}
              />
              <textarea
                placeholder="Что у вас нового?" value={formBody} maxLength={600}
                onChange={(e) => setFormBody(e.target.value)} required
                className={`${inputClass} min-h-[120px] resize-none`}
              />
              <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/50">
                <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">Лайков для раскрытия:</span>
                <input
                  type="number" min="1" max="100" value={formRevealLikes}
                  onChange={(e) => setFormRevealLikes(Number(e.target.value))} required
                  className="w-20 bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-700 text-black dark:text-white rounded-lg p-1.5 text-center outline-none focus:ring-2 focus:ring-purple-400 font-bold"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className={primaryBtn}>Опубликовать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ПРОСМОТР / РЕДАКТИРОВАНИЕ ПОСТА */}
      {activePost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setActivePost(null)}>
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h3 className="font-bold">{canEditActive ? "Управление постом" : "Просмотр поста"}</h3>
              <button onClick={() => setActivePost(null)} aria-label="Закрыть" className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <input
                type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} disabled={!canEditActive}
                maxLength={80} className={`${inputClass} font-semibold`}
              />
              <textarea
                value={formBody} onChange={(e) => setFormBody(e.target.value)} disabled={!canEditActive}
                maxLength={600} className={`${inputClass} min-h-[160px] resize-none`}
              />
              {canEditActive ? (
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => { deletePost(activePost.id); setActivePost(null); }}
                    className="text-red-500 font-bold px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    Удалить
                  </button>
                  <button onClick={handleSavePost} className={primaryBtn}>Сохранить</button>
                </div>
              ) : (
                <div className="pt-2 text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Редактировать может только автор.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА: РЕДАКТИРОВАНИЕ ПРОФИЛЯ */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsEditProfileOpen(false)}>
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h3 className="font-bold text-lg">Редактировать профиль</h3>
              <button onClick={() => setIsEditProfileOpen(false)} aria-label="Закрыть" className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Имя</label>
                  <input type="text" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} required maxLength={30} className={`${inputClass} font-medium`} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Фамилия</label>
                  <input type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} required maxLength={30} className={`${inputClass} font-medium`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">О себе</label>
                <textarea value={formBio} onChange={(e) => setFormBio(e.target.value)} maxLength={200} className={`${inputClass} min-h-[100px] resize-none`} />
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
