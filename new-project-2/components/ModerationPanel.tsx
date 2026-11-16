"use client";
import React, { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import PostCard from "@/components/PostCard";
import { plural } from "@/lib/format";

export default function ModerationPanel() {
  const { posts, users, isModerator, openProfile, deletePost, dismissReports } = useContext(AppContext);

  if (!isModerator) {
    return (
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm p-10 text-center mb-12">
        <h2 className="text-xl font-black text-black dark:text-white mb-2">Нет доступа</h2>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">Панель модерации доступна только модераторам сайта.</p>
        <button onClick={() => openProfile(null)} className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full text-sm font-bold">
          Вернуться в ленту
        </button>
      </div>
    );
  }

  const reported = posts.filter((p) => p.reports.length > 0).sort((a, b) => b.reports.length - a.reports.length);
  const anonymous = posts.filter((p) => p.isAnonymous);

  const stats = [
    { label: "Всего постов", value: posts.length },
    { label: "Скрытых авторов", value: anonymous.length },
    { label: "Жалоб", value: reported.length },
  ];

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-[30px] shadow-sm overflow-clip mb-12">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 sticky top-16 z-30 bg-white/90 dark:bg-black/90 backdrop-blur flex items-center">
        <button onClick={() => openProfile(null)} className="text-black dark:text-white font-bold hover:opacity-70 transition">
          ← Назад в ленту
        </button>
      </div>

      <div className="p-5 border-b border-gray-200 dark:border-neutral-800">
        <h2 className="text-2xl font-black text-black dark:text-white mb-1">Панель модерации</h2>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
          Здесь видны жалобы пользователей и настоящие авторы анонимных постов. Эти данные недоступны остальным.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-black dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">
        Жалобы
      </h3>
      {reported.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-neutral-500 py-10 text-sm">Жалоб нет. Всё спокойно.</p>
      ) : (
        reported.map((post) => (
          <div key={post.id} className="border-b border-gray-200 dark:border-neutral-800">
            <PostCard post={post} />
            <div className="px-5 pb-4 -mt-1 flex items-center gap-3 flex-wrap bg-white dark:bg-black">
              <span className="text-sm text-gray-600 dark:text-neutral-400">
                {post.reports.length} {plural(post.reports.length, ["жалоба", "жалобы", "жалоб"])} от{" "}
                {post.reports.map((id) => `@${users[id]?.username ?? "?"}`).join(", ")}
              </span>
              <div className="ml-auto flex gap-2">
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

      <h3 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">
        Анонимные посты и их авторы
      </h3>
      {anonymous.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-neutral-500 py-10 text-sm">Анонимных постов нет.</p>
      ) : (
        anonymous.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
