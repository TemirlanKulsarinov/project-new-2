"use client";
import React, { useState, useContext } from "react";
import { AppContext } from "@/context/AppContext";
import PostCard from "@/components/PostCard";

export default function Home() {
  const { posts, currentUser, addPost, users, setCurrentUser } = useContext(AppContext);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    addPost(title, body);
    setTitle("");
    setBody("");
  };

  if (!currentUser) {
    return <div className="text-center py-10 font-medium text-gray-500">Загрузка соцсети...</div>;
  }

  return (
    <div>
      {/* Селектор аккаунтов */}
      <div className="mb-6 flex items-center justify-between text-sm bg-white/60 p-3 rounded-xl border border-white">
        <span className="text-gray-600 font-medium">Текущий аккаунт:</span>
        <select
          className="bg-white border border-purple-200 rounded-lg px-3 py-1.5 outline-none font-semibold text-purple-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
          value={currentUser.id}
          onChange={(e) => setCurrentUser(users[Number(e.target.value)])}
        >
          {Object.values(users).map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName} (@{u.username})
            </option>
          ))}
        </select>
      </div>

      {/* Форма создания анонимного поста */}
      <div className="glass-card rounded-2xl p-6 mb-10 shadow-lg">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>✨</span> Написать анонимный пост
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок секрета..."
            className="w-full px-4 py-2.5 rounded-xl border border-purple-100 bg-white/90 outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-800"
            required
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Что у тебя на уме? Никто не узнает, пока пост не наберет 5 лайков..."
            className="w-full min-h-[100px] p-4 rounded-xl border border-purple-100 bg-white/90 resize-none outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
            required
          />
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-gray-500">
              🔒 Имя будет скрыто по умолчанию
            </span>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Опубликовать
            </button>
          </div>
        </form>
      </div>

      {/* Лента постов */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4 pl-1">Лента откровений</h2>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}