"use client";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppContext, Post } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import ModeratorBadge from "@/components/ModeratorBadge";
import LikeButton from "@/components/LikeButton";
import TimeAgo from "@/components/TimeAgo";
import { useModal } from "@/lib/useModal";
import { plural } from "@/lib/format";

const fieldClass =
  "w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500";

// Окно открытого поста: текст, действия и комментарии
function PostModalInner({ post }: { post: Post }) {
  const {
    users, currentUser, isModerator, openPost, openProfile,
    updatePost, deletePost, addComment, deleteComment, reportPost,
  } = useContext(AppContext);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState("");

  const close = useCallback(() => openPost(null), [openPost]);
  useModal(true, close);

  const author = users[post.userId];
  const isOwn = post.userId === currentUser.id;
  const isAnon = post.isAnonymous;
  const canDelete = isOwn || isModerator;
  const alreadyReported = post.reports.includes(currentUser.id);

  // Прокрутка вниз только когда добавили новый комментарий
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(post.comments.length);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && post.comments.length > prevCount.current) {
      if (typeof el.scrollTo === "function") el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      else el.scrollTop = el.scrollHeight;
    }
    prevCount.current = post.comments.length;
  }, [post.comments.length]);

  const goProfile = (id: number) => {
    openPost(null);
    openProfile(id);
  };

  const saveEdit = () => {
    if (!title.trim() || !body.trim()) return;
    updatePost(post.id, title.trim(), body.trim());
    setEditing(false);
  };

  const submitComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText("");
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Пост"
        className="modal-panel bg-white dark:bg-neutral-900 w-full sm:max-w-xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white flex-shrink-0">
          <h2 className="font-bold">Пост</h2>
          <button onClick={close} aria-label="Закрыть" className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
        </div>

        <div ref={scrollRef} className="overflow-y-auto flex-1">
          <div className="p-5 border-b border-gray-100 dark:border-neutral-800">
            {/* Автор */}
            <div className="flex items-center gap-3 mb-4">
              {isAnon ? (
                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold border border-gray-300 dark:border-neutral-700 shadow-inner">?</div>
              ) : (
                <button type="button" onClick={() => goProfile(author.id)} aria-label={`Профиль ${author.username}`}>
                  <Avatar src={author.image} sizeClass="w-11 h-11" />
                </button>
              )}
              <div className="min-w-0">
                <div className="font-bold text-black dark:text-white flex items-center gap-1">
                  {isAnon ? (
                    <span className="text-gray-500 dark:text-gray-400">Анонимный автор</span>
                  ) : (
                    <button type="button" onClick={() => goProfile(author.id)} className="hover:underline">
                      {author.username}
                    </button>
                  )}
                  {!isAnon && author.verified && <VerifiedBadge />}
                </div>
                <TimeAgo ts={post.createdAt} className="text-xs text-gray-500 dark:text-neutral-400" />
              </div>
            </div>

            {isModerator && isAnon && !isOwn && (
              <div className="mb-4 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3">
                Пост анонимный. Автор:{" "}
                <button type="button" onClick={() => goProfile(author.id)} className="font-bold underline">
                  @{author.username}
                </button>{" "}
                (видно только модератору)
              </div>
            )}

            {/* Текст */}
            {editing ? (
              <div className="flex flex-col gap-3">
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={`${fieldClass} font-semibold`} />
                <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} className={`${fieldClass} min-h-[140px] resize-none`} />
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-black dark:text-white mb-1 break-words">{post.title}</h3>
                <p className="text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">{post.body}</p>
              </>
            )}

            {isAnon && (
              <p className="mt-3 text-xs font-semibold text-purple-700 dark:text-purple-400">
                Автор раскроется после {post.revealLikes} {plural(post.revealLikes, ["лайка", "лайков", "лайков"])}. Сейчас: {post.likes}.
              </p>
            )}

            {/* Действия */}
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <LikeButton post={post} />
              <span className="text-sm text-gray-500 dark:text-neutral-400">
                {post.comments.length} {plural(post.comments.length, ["комментарий", "комментария", "комментариев"])}
              </span>

              <div className="ml-auto flex items-center gap-1 flex-wrap justify-end">
                {isOwn && !editing && (
                  <button onClick={() => setEditing(true)} className="text-sm font-semibold px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800">
                    Редактировать
                  </button>
                )}
                {editing && (
                  <>
                    <button onClick={() => { setEditing(false); setTitle(post.title); setBody(post.body); }} className="text-sm font-semibold px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800">
                      Отмена
                    </button>
                    <button onClick={saveEdit} className="text-sm font-bold px-4 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black">
                      Сохранить
                    </button>
                  </>
                )}
                {!isOwn && (
                  <button
                    onClick={() => reportPost(post.id)}
                    disabled={alreadyReported}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-default"
                  >
                    {alreadyReported ? "Жалоба отправлена" : "Пожаловаться"}
                  </button>
                )}
                {canDelete && !editing && (
                  confirmDelete ? (
                    <span className="flex items-center gap-1">
                      <button onClick={() => deletePost(post.id)} className="text-sm font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white">
                        Да, удалить
                      </button>
                      <button onClick={() => setConfirmDelete(false)} className="text-sm font-semibold px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800">
                        Отмена
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="text-sm font-semibold px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      {isOwn ? "Удалить" : "Удалить как модератор"}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Комментарии */}
          <div className="py-2">
            {post.comments.length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-neutral-500 py-8">
                Комментариев пока нет. Напишите первым.
              </p>
            )}
            {post.comments.map((c) => {
              const cu = users[c.userId];
              const canRemove = c.userId === currentUser.id || isModerator;
              return (
                <div key={c.id} className="px-5 py-3 flex gap-3">
                  <button type="button" onClick={() => goProfile(cu.id)} aria-label={`Профиль ${cu.username}`} className="flex-shrink-0">
                    <Avatar src={cu.image} sizeClass="w-9 h-9" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={() => goProfile(cu.id)} className="text-sm font-bold text-black dark:text-white hover:underline flex items-center gap-1">
                        {cu.username}
                        {cu.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                      </button>
                      {cu.role === "moderator" && <ModeratorBadge />}
                      <TimeAgo ts={c.createdAt} className="text-xs text-gray-400 dark:text-neutral-500" />
                      {canRemove && (
                        <button
                          onClick={() => deleteComment(post.id, c.id)}
                          className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Удалить комментарий"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words mt-0.5">{c.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Поле комментария */}
        <form onSubmit={submitComment} className="border-t border-gray-100 dark:border-neutral-800 p-3 flex gap-3 items-end flex-shrink-0">
          <Avatar src={currentUser.image} sizeClass="w-9 h-9" className="mb-1" />
          <div className="flex-1 min-w-0">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
              placeholder={`Комментарий от @${currentUser.username}`}
              maxLength={300}
              rows={2}
              className={`${fieldClass} resize-none text-sm`}
            />
            <div className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">
              Enter — отправить, Shift+Enter — новая строка · {commentText.length}/300
            </div>
          </div>
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="mb-5 bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-sm font-bold disabled:opacity-40 transition-opacity"
          >
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PostModal() {
  const { posts, activePostId } = useContext(AppContext);
  const post = activePostId !== null ? posts.find((p) => p.id === activePostId) : undefined;
  if (!post) return null;
  // key сбрасывает локальное состояние при открытии другого поста
  return <PostModalInner key={post.id} post={post} />;
}
