"use client";
import React, { useContext } from "react";
import Link from "next/link";
import { AppContext, Report } from "@/context/AppContext";
import PostCard from "@/components/PostCard";
import BackBar from "@/components/BackBar";
import TimeAgo from "@/components/TimeAgo";
import { cardClass } from "@/lib/ui";
import { plural } from "@/lib/format";

// Сводка причин: «Спам или реклама ×2, Другое»
function reasonsSummary(reports: Report[]) {
  const counts = new Map<string, number>();
  reports.forEach((r) => counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1));
  return [...counts.entries()].map(([reason, n]) => (n > 1 ? `${reason} ×${n}` : reason)).join(", ");
}

export default function ModerationPanel() {
  const { ready, posts, users, isModerator, deletePost, deleteComment, dismissReports, dismissCommentReports } =
    useContext(AppContext);

  if (!ready) {
    return <div className={`${cardClass} p-10 text-center text-gray-500 dark:text-neutral-500`}>Загрузка…</div>;
  }

  if (!isModerator) {
    return (
      <div className={`${cardClass} p-10 text-center`}>
        <h1 className="text-xl font-black text-black dark:text-white mb-2">Нет доступа</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">Панель модерации доступна только модераторам сайта.</p>
        <Link href="/" className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full text-sm font-bold">
          Вернуться в ленту
        </Link>
      </div>
    );
  }

  const reportedPosts = posts.filter((p) => p.reports.length > 0).sort((a, b) => b.reports.length - a.reports.length);
  const reportedComments = posts
    .flatMap((p) => p.comments.filter((c) => c.reports.length > 0).map((c) => ({ post: p, comment: c })))
    .sort((a, b) => b.comment.reports.length - a.comment.reports.length);
  const anonymous = posts.filter((p) => p.isAnonymous);

  const stats = [
    { label: "Всего постов", value: posts.length },
    { label: "Скрытых авторов", value: anonymous.length },
    { label: "Жалоб на посты", value: reportedPosts.length },
    { label: "Жалоб на комментарии", value: reportedComments.length },
  ];

  const names = (reports: Report[]) => reports.map((r) => `@${users[r.userId]?.username ?? "?"}`).join(", ");

  return (
    <div className={cardClass}>
      <BackBar label="В ленту" />

      <div className="p-5 border-b border-gray-200 dark:border-neutral-800">
        <h1 className="text-2xl font-black text-black dark:text-white mb-1">Панель модерации</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
          Здесь видны жалобы пользователей и настоящие авторы анонимных постов. Эти данные недоступны остальным.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-black dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Жалобы на посты */}
      <h2 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">
        Жалобы на посты
      </h2>
      {reportedPosts.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-neutral-500 py-10 text-sm">Жалоб на посты нет.</p>
      ) : (
        reportedPosts.map((post) => (
          <div key={post.id} className="border-b border-gray-200 dark:border-neutral-800">
            <PostCard post={post} />
            <div className="px-5 pb-4 -mt-1 bg-white dark:bg-black">
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                {post.reports.length} {plural(post.reports.length, ["жалоба", "жалобы", "жалоб"])}: {reasonsSummary(post.reports)}
              </p>
              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">От {names(post.reports)}</p>
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  onClick={() => dismissReports(post.id)}
                  className="text-sm font-semibold px-4 py-1.5 rounded-full border border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  Оставить пост
                </button>
                <button
                  onClick={() => { if (window.confirm("Удалить этот пост?")) deletePost(post.id); }}
                  className="text-sm font-bold px-4 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Жалобы на комментарии */}
      <h2 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">
        Жалобы на комментарии
      </h2>
      {reportedComments.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-neutral-500 py-10 text-sm">Жалоб на комментарии нет.</p>
      ) : (
        reportedComments.map(({ post, comment }) => {
          const cu = users[comment.userId];
          return (
            <div key={comment.id} className="p-5 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Link href={`/u/${cu.username}`} className="font-bold text-black dark:text-white hover:underline">@{cu.username}</Link>
                <TimeAgo ts={comment.createdAt} className="text-xs text-gray-400 dark:text-neutral-500" />
                <span className="text-xs text-gray-400 dark:text-neutral-500">· в посте</span>
                <Link href={`/post/${post.id}`} className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                  «{post.title}»
                </Link>
              </div>
              <p className="mt-1 text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{comment.text}</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                {comment.reports.length} {plural(comment.reports.length, ["жалоба", "жалобы", "жалоб"])}: {reasonsSummary(comment.reports)}
              </p>
              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">От {names(comment.reports)}</p>
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  onClick={() => dismissCommentReports(post.id, comment.id)}
                  className="text-sm font-semibold px-4 py-1.5 rounded-full border border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  Оставить комментарий
                </button>
                <button
                  onClick={() => { if (window.confirm("Удалить этот комментарий?")) deleteComment(post.id, comment.id); }}
                  className="text-sm font-bold px-4 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Скрытые авторы */}
      <h2 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">
        Анонимные посты и их авторы
      </h2>
      {anonymous.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-neutral-500 py-10 text-sm">Анонимных постов нет.</p>
      ) : (
        anonymous.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
