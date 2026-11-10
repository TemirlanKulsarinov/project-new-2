"use client";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { AppContext, Post, TimeAgo } from "@/context/AppContext";
import PostCard from "@/components/PostCard";
import Background from "@/components/Background";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import ModeratorBadge from "@/components/ModeratorBadge";

const inputClass = "w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 disabled:opacity-70";
const primaryBtn = "bg-black dark:bg-white text-white dark:text-black px-8 py-2.5 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors";

export default function Home() {
  const { posts, users, currentUser, isModerator, profileId, openProfile, addPost, updatePost, deletePost, updateUser, addComment } = useContext(AppContext);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [isEditingActivePost, setIsEditingActivePost] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formRevealLikes, setFormRevealLikes] = useState<number>(5);
  const [formComment, setFormComment] = useState("");
  
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formBio, setFormBio] = useState("");

  const anyModalOpen = isCreateOpen || !!activePost || isEditProfileOpen;

  useEffect(() => {
    if (!anyModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCreateOpen(false); setActivePost(null); setIsEditProfileOpen(false); setIsEditingActivePost(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [anyModalOpen]);

  const profileUser = profileId ? users[profileId] : null;

  const profilePosts = useMemo(() => profileId ? posts.filter((p) => p.userId === profileId && (!p.isAnonymous || p.userId === currentUser.id || isModerator)) : [], [posts, profileId, currentUser.id, isModerator]);

  const openCreateModal = () => { setFormTitle(""); setFormBody(""); setFormRevealLikes(5); setIsCreateOpen(true); };
  
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
    setFormComment("");
    setIsEditingActivePost(false);
  };

  const handleSavePost = () => {
    if (!activePost || !formTitle.trim() || !formBody.trim()) return;
    updatePost(activePost.id, formTitle.trim(), formBody.trim());
    setIsEditingActivePost(false);
    setActivePost(prev => prev ? { ...prev, title: formTitle.trim(), body: formBody.trim() } : null);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !formComment.trim()) return;
    addComment(activePost.id, formComment.trim());
    setFormComment("");
    const newComment = { id: Date.now(), userId: currentUser.id, text: formComment.trim(), createdAt: Date.now() };
    setActivePost(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
  };

  const openProfileTab = (userId: number, e: React.MouseEvent) => { e.stopPropagation(); openProfile(userId); };

  const openEditProfile = () => {
    if (!profileUser) return;
    setFormFirstName(profileUser.firstName); setFormLastName(profileUser.lastName); setFormBio(profileUser.bio);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !formFirstName.trim() || !formLastName.trim()) return;
    updateUser(profileId, formFirstName.trim(), formLastName.trim(), formBio);
    setIsEditProfileOpen(false);
  };

  return (
    <div className="relative min-h-screen">
      <Background />

      <div className="relative z-10 pt-6">
        {profileUser ? (
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm overflow-clip mb-12 min-h-screen">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 sticky top-16 z-30 bg-white/90 dark:bg-black/90 backdrop-blur flex justify-between items-center">
              <button onClick={() => openProfile(null)} className="flex items-center gap-2 text-black dark:text-white font-bold hover:opacity-70 transition">
                ← Назад в ленту
              </button>
              {profileUser.id === currentUser.id && (
                <button onClick={openEditProfile} className="bg-gray-100 dark:bg-neutral-800 text-black dark:text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition">
                  Редактировать
                </button>
              )}
            </div>

            <div className="p-8 text-center border-b border-gray-200 dark:border-neutral-800">
              <div className="mx-auto mb-4 w-32 h-32"><Avatar src={profileUser.image} sizeClass="w-32 h-32" className="border-4 shadow-md" /></div>
              <h2 className="text-2xl font-black text-black dark:text-white flex items-center justify-center gap-2">
                {profileUser.firstName} {profileUser.lastName} {profileUser.verified && <VerifiedBadge className="w-5 h-5" />}
              </h2>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">@{profileUser.username}</p>
              {profileUser.role === "moderator" && <ModeratorBadge className="mb-4" />}
              <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 max-w-md mx-auto shadow-inner border border-gray-200 dark:border-neutral-800 whitespace-pre-wrap">
                {profileUser.bio || "Пока ничего не рассказал о себе."}
              </div>
            </div>

            <h3 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">Посты пользователя</h3>
            <div className="flex flex-col pb-6">
              {profilePosts.map((post) => <PostCard key={post.id} post={post} onView={openViewModal} onProfileClick={openProfileTab} />)}
              {profilePosts.length === 0 && <p className="text-center text-gray-500 py-10">Нет постов.</p>}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm overflow-hidden mb-12">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
              <h2 className="text-2xl font-black text-black dark:text-white">Лента</h2>
              <button onClick={openCreateModal} className={primaryBtn}>Создать пост</button>
            </div>
            <div className="flex flex-col">
              {posts.map((post) => <PostCard key={post.id} post={post} onView={openViewModal} onProfileClick={openProfileTab} />)}
            </div>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsCreateOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h3 className="font-bold text-lg">Новый анонимный пост</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <input type="text" placeholder="Заголовок" value={formTitle} maxLength={80} onChange={(e) => setFormTitle(e.target.value)} required autoFocus className={`${inputClass} font-medium`} />
              <textarea placeholder="Что у вас нового?" value={formBody} maxLength={600} onChange={(e) => setFormBody(e.target.value)} required className={`${inputClass} min-h-[120px] resize-none`} />
              <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/50">
                <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">Лайков для раскрытия:</span>
                <input type="number" min="1" max="100" value={formRevealLikes} onChange={(e) => setFormRevealLikes(Number(e.target.value))} required className="w-20 bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-700 text-black dark:text-white rounded-lg p-1.5 text-center outline-none font-bold" />
              </div>
              <div className="flex justify-end pt-2"><button type="submit" className={primaryBtn}>Опубликовать</button></div>
            </form>
          </div>
        </div>
      )}

      {activePost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 md:p-4" onClick={() => { setActivePost(null); setIsEditingActivePost(false); }}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white shrink-0">
              <h3 className="font-bold flex items-center gap-2">
                {isEditingActivePost ? "Редактирование" : "Обсуждение"}
              </h3>
              <div className="flex items-center gap-3">
                {activePost.userId === currentUser.id && !isEditingActivePost && (
                  <button onClick={() => setIsEditingActivePost(true)} className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition">Изменить</button>
                )}
                <button onClick={() => { setActivePost(null); setIsEditingActivePost(false); }} className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                {activePost.isAnonymous ? (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-gray-500 font-bold border border-gray-300 dark:border-neutral-700">?</div>
                ) : (
                  <Avatar src={users[activePost.userId].image} sizeClass="w-10 h-10" />
                )}
                <div>
                  <div className="font-bold text-sm text-black dark:text-white flex items-center gap-1">
                    {activePost.isAnonymous ? "Анонимный автор" : users[activePost.userId].username}
                    {!activePost.isAnonymous && users[activePost.userId].verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400">
                    <TimeAgo timestamp={activePost.createdAt} />
                  </div>
                </div>
              </div>

              {isEditingActivePost ? (
                <>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} maxLength={80} className={`${inputClass} font-bold`} />
                  <textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} maxLength={600} className={`${inputClass} min-h-[160px] resize-none`} />
                  <div className="flex justify-between pt-2">
                    <button onClick={() => { deletePost(activePost.id); setActivePost(null); setIsEditingActivePost(false); }} className="text-red-500 font-bold px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Удалить</button>
                    <button onClick={handleSavePost} className={primaryBtn}>Сохранить</button>
                  </div>
                </>
              ) : (
                <div className="mb-4">
                  <h4 className="font-bold text-lg text-black dark:text-white mb-2">{activePost.title}</h4>
                  <p className="text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{activePost.body}</p>
                </div>
              )}

              {isModerator && activePost.isAnonymous && activePost.userId !== currentUser.id && (
                <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2 mb-4">
                  Только для модераторов: автор @{users[activePost.userId].username}
                </div>
              )}

              {!isEditingActivePost && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                  <h4 className="font-bold text-black dark:text-white mb-4">Комментарии ({activePost.comments?.length || 0})</h4>
                  <div className="flex flex-col gap-4">
                    {activePost.comments?.map(comment => {
                      const cAuthor = users[comment.userId];
                      return (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar src={cAuthor.image} sizeClass="w-8 h-8 mt-1" />
                          <div className="flex-1 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl rounded-tl-none p-3 border border-gray-100 dark:border-neutral-800">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <span className="font-bold text-sm text-black dark:text-white flex items-center gap-1">
                                {cAuthor.username}
                                {cAuthor.verified && <VerifiedBadge className="w-3 h-3" />}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                <TimeAgo timestamp={comment.createdAt} />
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{comment.text}</p>
                          </div>
                        </div>
                      )
                    })}
                    {(!activePost.comments || activePost.comments.length === 0) && (
                      <p className="text-sm text-gray-400 text-center py-4">Здесь пока тихо. Напишите первым!</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isEditingActivePost && (
              <div className="p-4 border-t border-gray-100 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900 rounded-b-2xl">
                <form onSubmit={handleSendComment} className="flex items-center gap-2">
                  <Avatar src={currentUser.image} sizeClass="w-9 h-9 hidden sm:block" />
                  <input 
                    type="text" value={formComment} onChange={e => setFormComment(e.target.value)} 
                    placeholder="Написать комментарий..." maxLength={200}
                    className="flex-1 bg-gray-100 dark:bg-neutral-800 text-sm border-transparent rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 text-black dark:text-white"
                  />
                  <button type="submit" disabled={!formComment.trim()} className="bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-full hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsEditProfileOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
              <h3 className="font-bold text-lg">Редактировать профиль</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">Имя</label><input type="text" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} required maxLength={30} className={`${inputClass} font-medium`} /></div>
                <div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">Фамилия</label><input type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} required maxLength={30} className={`${inputClass} font-medium`} /></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">О себе</label><textarea value={formBio} onChange={(e) => setFormBio(e.target.value)} maxLength={200} className={`${inputClass} min-h-[100px] resize-none`} /></div>
              <div className="flex justify-end pt-2"><button type="submit" className={primaryBtn}>Сохранить</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}