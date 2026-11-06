"use client";
import React, { useContext, useState, useEffect, useRef } from "react";
import { AppContext, Post } from "@/context/AppContext";

interface PostCardProps {
  post: Post;
  onView: (post: Post) => void;
  onProfileClick: (userId: number, e: React.MouseEvent) => void;
}

export default function PostCard({ post, onView, onProfileClick }: PostCardProps) {
  const { users, toggleLike } = useContext(AppContext);
  const author = users[post.userId];
  const isAnon = post.isAnonymous;

  const [isLikedLocal, setIsLikedLocal] = useState(false);
  const [justRevealed, setJustRevealed] = useState(false);
  const prevAnon = useRef(post.isAnonymous);

  useEffect(() => {
    if (prevAnon.current === true && post.isAnonymous === false) {
      setJustRevealed(true);
      setTimeout(() => setJustRevealed(false), 1500);
    }
    prevAnon.current = post.isAnonymous;
  }, [post.isAnonymous]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLikedLocal(true);
    toggleLike(post.id);
  };

  return (
    <div 
      className={`p-5 cursor-pointer flex gap-4 transition-colors border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-900/50 bg-white dark:bg-black ${justRevealed ? 'animate-reveal' : ''}`}
      onClick={() => onView(post)}
    >
      {/* ИСПРАВЛЕНИЕ АВАТАРА В ЛЕНТЕ */}
      <div className="flex-shrink-0 pt-1">
        {isAnon ? (
          <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold border border-gray-300 dark:border-neutral-700 shadow-inner">
            ?
          </div>
        ) : (
          <div 
            className="w-11 h-11 rounded-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => onProfileClick(author.id, e)}
          >
            <img
              src={author.image}
              alt="avatar"
              className="w-[85%] h-[85%] object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-baseline gap-2 mb-1.5">
          <span 
            className={`font-bold text-[15px] ${isAnon ? "text-gray-500 dark:text-gray-400" : "text-black dark:text-white hover:underline cursor-pointer"}`}
            onClick={!isAnon ? (e) => onProfileClick(author.id, e) : undefined}
          >
            {isAnon ? "Анонимный автор" : author.username}
          </span>
          <span className="text-gray-400 dark:text-neutral-500 text-sm truncate">— {post.title}</span>
        </div>

        <p className="text-[15px] text-gray-900 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
          {post.body}
        </p>

        <div className="mt-4 flex items-center gap-5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors group ${isLikedLocal ? 'insta-liked' : 'text-gray-500 dark:text-neutral-400'}`}
          >
            <svg 
              className="w-5 h-5 group-hover:text-red-500 transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className={`text-sm font-medium ${isLikedLocal ? 'text-red-500' : ''}`}>{post.likes}</span>
          </button>
          
          {isAnon && (
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full border border-purple-100 dark:border-purple-800/50">
              Осталось лайков: {Math.max(0, post.revealLikes - post.likes)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}