"use client";
import React, { useContext, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import ModeratorBadge from "@/components/ModeratorBadge";
import LikeButton from "@/components/LikeButton";
import BookmarkButton from "@/components/BookmarkButton";
import TimeAgo from "@/components/TimeAgo";
import BackBar from "@/components/BackBar";
import ReportDialog from "@/components/ReportDialog";
import PostSkeleton from "@/components/PostSkeleton";
import { cardClass, inputClass, ghostBtn } from "@/lib/ui";
import { plural } from "@/lib/format";

type ReportTarget = { type: "post" } | { type: "comment"; commentId: number } | null;

// Страница поста (адрес /post/123): текст, действия, комментарии
export default function PostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    ready, posts, users, currentUser, isModerator, deletePost, addComment, deleteComment,
    reportPost, reportComment, pushToast,
  } = useContext(AppContext);

  const [commentText, setCommentText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);

  if (!ready) {
    return (
      <div className={cardClass}>
        <BackBar />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  const post = posts.find((p) => String(p.id) === params.id);
  if (!post) {
    return (
      <div className={`${cardClass} p-10 text-center`}>
        <h1 className="text-xl font-black text-black dark:text-white mb-2">Пост не найден</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">Возможно, его удалили или ссылка неверная.</p>
        <Link href="/" className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full text-sm font-bold">
          В ленту
        </Link>
      </div>
    );
  }

  const author = users[post.userId];
  const isOwn = post.userId === currentUser.id;
  const isAnon = post.isAnonymous;
  const canDelete = isOwn || isModerator;
  const alreadyReported = post.reports.some((r) => r.userId === currentUser.id);

  const submitComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText("");
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      pushToast("Ссылка на пост скопирована");
    } catch {
      pushToast("Не удалось скопировать ссылку");
    }
  };

  return (
    <div className={cardClass}>
      <BackBar />

      <div className="p-5 border-b border-gray-200 dark:border-neutral-800">
        {/* Автор */}
        <div className="flex items-center gap-3 mb-4">
          {isAnon ? (
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold border border-gray-300 dark:border-neutral-700 shadow-inner">?</div>
          ) : (
            <Link href={`/u/${author.username}`} aria-label={`Профиль ${author.username}`}>
              <Avatar src={author.image} sizeClass="w-11 h-11" />
            </Link>
          )}
          <div className="min-w-0">
            <div className="font-bold text-black dark:text-white flex items-center gap-1">
              {isAnon ? (
                <span className="text-gray-500 dark:text-gray-400">Анонимный автор</span>
              ) : (
                <Link href={`/u/${author.username}`} className="hover:underline">{author.username}</Link>
              )}
              {!isAnon && author.verified && <VerifiedBadge />}
            </div>
            <TimeAgo ts={post.createdAt} className="text-xs text-gray-500 dark:text-neutral-400" />
          </div>
        </div>

        {isModerator && isAnon && !isOwn && (
          <div className="mb-4 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3">
            Пост анонимный. Автор:{" "}
            <Link href={`/u/${author.username}`} className="font-bold underline">@{author.username}</Link>{" "}
            (видно только модератору)
          </div>
        )}

        <h1 className="text-xl font-bold text-black dark:text-white mb-1 break-words">{post.title}</h1>
        <p className="text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">{post.body}</p>

        {isAnon && (
          <div className="mt-4">
            <div className="h-1.5 max-w-xs rounded-full bg-purple-100 dark:bg-purple-900/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((post.likes / post.revealLikes) * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-purple-700 dark:text-purple-400">
              Автор раскроется после {post.revealLikes} {plural(post.revealLikes, ["лайка", "лайков", "лайков"])}. Сейчас: {post.likes}.
            </p>
          </div>
        )}

        {isModerator && post.reports.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-red-700 dark:text-red-400">
            Жалоб на пост: {post.reports.length}. Разобрать их можно в панели модерации.
          </p>
        )}

        {/* Действия */}
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <LikeButton post={post} />
          <BookmarkButton post={post} />
          <button
            onClick={share}
            aria-label="Скопировать ссылку"
            title="Скопировать ссылку"
            className="text-gray-500 dark:text-neutral-400 hover:text-sky-500 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7" />
              <path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7" />
            </svg>
          </button>
          <span className="text-sm text-gray-500 dark:text-neutral-400">
            {post.comments.length} {plural(post.comments.length, ["комментарий", "комментария", "комментариев"])}
          </span>

          <div className="ml-auto flex items-center gap-1 flex-wrap justify-end">
            {!isOwn && (
              <button
                onClick={() => setReportTarget({ type: "post" })}
                disabled={alreadyReported}
                className={`${ghostBtn} disabled:opacity-60 disabled:cursor-default`}
              >
                {alreadyReported ? "Жалоба отправлена" : "Пожаловаться"}
              </button>
            )}
            {canDelete &&
              (confirmDelete ? (
                <span className="flex items-center gap-1">
                  <button
                    onClick={() => { deletePost(post.id); router.push("/"); }}
                    className="text-sm font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white"
                  >
                    Да, удалить
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className={ghostBtn}>Отмена</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="text-sm font-semibold px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  {isOwn ? "Удалить" : "Удалить как модератор"}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Комментарии */}
      <h2 className="px-5 pt-4 text-lg font-bold text-black dark:text-white">Комментарии</h2>
      <div className="py-2">
        {post.comments.length === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-neutral-500 py-8">Комментариев пока нет. Напишите первым.</p>
        )}
        {post.comments.map((c) => {
          const cu = users[c.userId];
          const canRemove = c.userId === currentUser.id || isModerator || isOwn;
          const canReport = c.userId !== currentUser.id;
          const reported = c.reports.some((r) => r.userId === currentUser.id);
          return (
            <div key={c.id} className="px-5 py-3 flex gap-3">
              <Link href={`/u/${cu.username}`} aria-label={`Профиль ${cu.username}`} className="flex-shrink-0">
                <Avatar src={cu.image} sizeClass="w-9 h-9" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/u/${cu.username}`} className="text-sm font-bold text-black dark:text-white hover:underline flex items-center gap-1">
                    {cu.username}
                    {cu.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                  </Link>
                  {cu.role === "moderator" && <ModeratorBadge />}
                  <TimeAgo ts={c.createdAt} className="text-xs text-gray-400 dark:text-neutral-500" />
                  {isModerator && c.reports.length > 0 && (
                    <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800/60">
                      Жалоб: {c.reports.length}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words mt-0.5">{c.text}</p>
                <div className="flex gap-3 mt-1">
                  {canReport && (
                    <button
                      onClick={() => setReportTarget({ type: "comment", commentId: c.id })}
                      disabled={reported}
                      className="text-xs text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:hover:text-gray-400 disabled:cursor-default"
                    >
                      {reported ? "Жалоба отправлена" : "Пожаловаться"}
                    </button>
                  )}
                  {canRemove && (
                    <button
                      onClick={() => deleteComment(post.id, c.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Поле комментария */}
      <form onSubmit={submitComment} className="border-t border-gray-100 dark:border-neutral-800 p-4 flex gap-3 items-end">
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
            className={`${inputClass} resize-none text-sm`}
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

      {reportTarget && (
        <ReportDialog
          title={reportTarget.type === "post" ? "Пожаловаться на пост" : "Пожаловаться на комментарий"}
          onClose={() => setReportTarget(null)}
          onSubmit={(reason) => {
            if (reportTarget.type === "post") reportPost(post.id, reason);
            else reportComment(post.id, reportTarget.commentId, reason);
            setReportTarget(null);
          }}
        />
      )}
    </div>
  );
}
