"use client";
import React, { useState, useContext, useEffect } from "react";
import { AppContext, Post } from "@/context/AppContext";
import PostCard from "@/components/PostCard";

// Компонент-обертка для фона
const Ribbon = ({ text, top, rotate, speed, scrollY }: { text: string, top: string, rotate: number, speed: number, scrollY: number }) => (
  <div 
    className="absolute flex items-center justify-center pointer-events-none"
    style={{ top, left: '-200%', width: '500%', transform: `rotate(${rotate}deg) translateX(${scrollY * speed}px)` }}
  >
    <span className="text-[60px] md:text-[100px] font-black whitespace-nowrap text-black dark:text-white opacity-5 dark:opacity-10 uppercase leading-none">
      {text}
    </span>
  </div>
);

export default function Home() {
  const { posts, users, currentUser, addPost, updatePost, deletePost, updateUser } = useContext(AppContext);
  
  // Состояния
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Форма поста
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formRevealLikes, setFormRevealLikes] = useState<number>(5);

  // Форма профиля
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formBio, setFormBio] = useState("");

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openCreateModal = () => {
    setFormTitle(""); setFormBody(""); setFormRevealLikes(5); setIsCreateOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim() || formRevealLikes < 1) return;
    addPost(formTitle, formBody, formRevealLikes);
    setIsCreateOpen(false);
  };

  const openViewModal = (post: Post) => {
    setActivePost(post); setFormTitle(post.title); setFormBody(post.body);
  };

  const openProfileTab = (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingProfileId(userId);
    window.scrollTo(0, 0); 
  };

  const openEditProfile = () => {
    if (!viewingProfileId) return;
    const u = users[viewingProfileId];
    setFormFirstName(u.firstName);
    setFormLastName(u.lastName);
    setFormBio(u.bio);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProfileId || !formFirstName.trim() || !formLastName.trim()) return;
    updateUser(viewingProfileId, formFirstName, formLastName, formBio);
    setIsEditProfileOpen(false);
  };

  const RIBBON_1 = Array(20).fill("THE WORLD IS YOURS").join(" • ");
  const RIBBON_2 = Array(20).fill("KEEP IN SECRET").join(" • ");
  const RIBBON_3 = Array(20).fill("NO ONE KNOWS").join(" • ");
  const RIBBON_4 = Array(20).fill("REVEAL YOURSELF").join(" • ");
  const RIBBON_5 = Array(20).fill("WHO ARE YOU?").join(" • ");
  const RIBBON_6 = Array(20).fill("DON'T TELL ANYONE").join(" • ");

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <Ribbon text={RIBBON_1} top="5%" rotate={-12} speed={0.4} scrollY={scrollY} />
        <Ribbon text={RIBBON_2} top="25%" rotate={10} speed={-0.5} scrollY={scrollY} />
        <Ribbon text={RIBBON_3} top="45%" rotate={-5} speed={0.6} scrollY={scrollY} />
        <Ribbon text={RIBBON_4} top="65%" rotate={15} speed={-0.4} scrollY={scrollY} />
        <Ribbon text={RIBBON_5} top="85%" rotate={-10} speed={0.5} scrollY={scrollY} />
        <Ribbon text={RIBBON_6} top="105%" rotate={8} speed={-0.3} scrollY={scrollY} />
      </div>

      <div className="relative z-10 pt-6">
        {viewingProfileId ? (
          /* ВКЛАДКА ПРОФИЛЯ */
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm overflow-hidden mb-12 min-h-screen">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 sticky top-16 z-30 bg-white/90 dark:bg-black/90 backdrop-blur flex justify-between items-center">
              <button 
                onClick={() => setViewingProfileId(null)}
                className="flex items-center gap-2 text-black dark:text-white font-bold hover:opacity-70 transition"
              >
                ← Назад в ленту
              </button>
              {viewingProfileId === currentUser.id && (
                <button 
                  onClick={openEditProfile}
                  className="bg-gray-100 dark:bg-neutral-800 text-black dark:text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
                >
                  Редактировать
                </button>
              )}
            </div>
            
            <div className="p-8 text-center border-b border-gray-200 dark:border-neutral-800 relative">
              {/* ИСПРАВЛЕНИЕ АВАТАРА ПРОФИЛЯ */}
              <div className="w-28 h-28 rounded-full border-4 border-white dark:border-neutral-900 bg-gray-100 dark:bg-neutral-800 shadow-sm mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <img 
                  src={users[viewingProfileId].image} 
                  alt="avatar" 
                  className="w-[80%] h-[80%] object-contain" 
                />
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white">{users[viewingProfileId].firstName} {users[viewingProfileId].lastName}</h2>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4">@{users[viewingProfileId].username}</p>
              <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 max-w-md mx-auto shadow-inner border border-gray-200 dark:border-neutral-800 whitespace-pre-wrap">
                {users[viewingProfileId].bio}
              </div>
            </div>

            <h3 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">Посты пользователя</h3>
            <div className="flex flex-col pb-6">
              {posts
                .filter(p => p.userId === viewingProfileId && (!p.isAnonymous || p.userId === currentUser.id))
                .map((post) => (
                  <PostCard key={post.id} post={post} onView={openViewModal} onProfileClick={openProfileTab} />
                ))}
              {posts.filter(p => p.userId === viewingProfileId && (!p.isAnonymous || p.userId === currentUser.id)).length === 0 && (
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
            </div>
            <div className="h-8 bg-gray-50 dark:bg-neutral-900 flex justify-center items-center">
              <div className="w-16 h-1 rounded-full bg-gray-300 dark:bg-neutral-700"></div>
            </div>
          </div>
        )}
      </div>

      {/* МОДАЛКА: СОЗДАНИЕ ПОСТА */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h3 className="font-bold text-lg">Новый анонимный пост</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <input 
                type="text" placeholder="Заголовок" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 font-medium"
              />
              <textarea 
                placeholder="Что у вас нового?" value={formBody} onChange={(e) => setFormBody(e.target.value)} required
                className="w-full min-h-[120px] bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 resize-none"
              />
              <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/50">
                <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">Лайков для раскрытия:</span>
                <input 
                  type="number" min="1" max="100" value={formRevealLikes} onChange={(e) => setFormRevealLikes(Number(e.target.value))} required
                  className="w-20 bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-700 text-black dark:text-white rounded-lg p-1.5 text-center outline-none focus:ring-2 focus:ring-purple-400 font-bold"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-8 py-2.5 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200">Опубликовать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ПРОСМОТР / РЕДАКТИРОВАНИЕ ПОСТА */}
      {activePost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setActivePost(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h3 className="font-bold">Управление постом</h3>
              <button onClick={() => setActivePost(null)} className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <input 
                type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} disabled={currentUser.id !== activePost.userId}
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 font-semibold"
              />
              <textarea 
                value={formBody} onChange={(e) => setFormBody(e.target.value)} disabled={currentUser.id !== activePost.userId}
                className="w-full min-h-[160px] bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 resize-none"
              />
              {currentUser.id === activePost.userId ? (
                <div className="flex justify-between pt-2">
                  <button onClick={() => { deletePost(activePost.id); setActivePost(null); }} className="text-red-500 font-bold px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Удалить</button>
                  <button onClick={() => { updatePost(activePost.id, formTitle, formBody); setActivePost(null); }} className="bg-black dark:bg-white text-white dark:text-black px-8 py-2.5 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200">Сохранить</button>
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

      {/* НОВАЯ МОДАЛКА: РЕДАКТИРОВАНИЕ ПРОФИЛЯ */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsEditProfileOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h3 className="font-bold text-lg">Редактировать профиль</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Имя</label>
                  <input 
                    type="text" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} required
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 font-medium"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Фамилия</label>
                  <input 
                    type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} required
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">О себе (Bio)</label>
                <textarea 
                  value={formBio} onChange={(e) => setFormBio(e.target.value)}
                  className="w-full min-h-[100px] bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-8 py-2.5 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}