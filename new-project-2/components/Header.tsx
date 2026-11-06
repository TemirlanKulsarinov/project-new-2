"use client";
import React, { useContext } from "react";
import { AppContext } from "@/context/AppContext";

export default function Header() {
  const { users, currentUser, setCurrentUser, theme, toggleTheme } = useContext(AppContext);

  return (
    <header className="bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-16 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">SecretSpace</h1>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="text-xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition text-black dark:text-white"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-900 p-1 pr-2 rounded-full border border-gray-200 dark:border-neutral-800">
            {/* ИСПРАВЛЕНИЕ АВАТАРА ХЕДЕРА */}
            <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
              <img 
                src={currentUser.image} 
                alt="avatar" 
                className="w-[80%] h-[80%] object-contain"
              />
            </div>
            
            <select
              className="minimal-select bg-transparent outline-none text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer pr-2"
              value={currentUser.id}
              onChange={(e) => setCurrentUser(users[Number(e.target.value)])}
            >
              {Object.values(users).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}