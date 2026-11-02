"use client";
import React, { useContext } from "react";
import { AppContext, Post } from "@/context/AppContext";

export default function PostCard({ post }: { post: Post }) {
  const { users, toggleLike } = useContext(AppContext);
  const author = users[post.userId];

  if (!author) return null;

  const isAnon = post.isAnonymous;

  return (
    <div className="glass-card rounded-2xl p-6 mb-6 transition-transform hover:-translate-y-1">
      <div className="flex items-center gap-4 mb-4">
        {isAnon ? (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-white text-xl font-bold shadow-md">
            ?
          </div>
        ) : (
          <img
            src={author.image}
            alt={author.username}
            className="w-12 h-12 rounded-full bg-purple-100 object-cover border-2 border-purple-300"
          />
        )}

        <div>
          <h3 className={`font-bold text-lg ${isAnon ? "text-purple-900" : "text-gray-900"}`}>
            {isAnon ? "🔒 Таинственный автор" : `${author.firstName} ${author.lastName}`}
          </h3>
          <p className="text-xs text-gray-500">
            {isAnon ? `Раскроется после ${post.revealLikes} лайков` : `@${author.username}`}
          </p>
        </div>
      </div>

      <h4 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h4>
      <p className="text-gray-700 text-base leading-relaxed mb-6">{post.body}</p>

      <div className="flex items-center justify-between border-t border-gray-100/60 pt-4">
        <button
          onClick={() => toggleLike(post.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 font-semibold transition-colors active:scale-95"
        >
          <span>❤️</span> {post.likes}
        </button>

        {isAnon && (
          <div className="text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full">
            До раскрытия: {Math.max(0, post.revealLikes - post.likes)} лайк(ов)
          </div>
        )}
      </div>
    </div>
  );
}