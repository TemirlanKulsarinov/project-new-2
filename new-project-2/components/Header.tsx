"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function Header() {
  const { users, currentUser, switchAccount, theme, toggleTheme, openProfile } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню по клику вне его и по Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const accounts = Object.values(users);

  return (
    <header className="bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-16 flex justify-between items-center">
        <button
          onClick={() => openProfile(null)}
          className="text-xl font-bold tracking-tight text-black dark:text-white hover:opacity-70 transition"
        >
          SecretSpace
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Сменить тему"
            className="text-xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition text-black dark:text-white"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="flex items-center gap-2 p-1 pr-3 rounded-full border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            >
              <Avatar src={currentUser.image} sizeClass="w-8 h-8" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 max-w-[110px] truncate">
                {currentUser.firstName}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {open && (
              <div
                role="menu"
                className="account-menu absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Текущий аккаунт */}
                <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-neutral-800">
                  <Avatar src={currentUser.image} sizeClass="w-12 h-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 font-bold text-black dark:text-white">
                      <span className="truncate">{currentUser.firstName} {currentUser.lastName}</span>
                      {currentUser.verified && <VerifiedBadge />}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-neutral-400 truncate">@{currentUser.username}</div>
                  </div>
                </div>

                <button
                  role="menuitem"
                  onClick={() => { openProfile(currentUser.id); setOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-black dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-800 transition border-b border-gray-100 dark:border-neutral-800"
                >
                  Открыть мой профиль
                </button>

                {/* Список аккаунтов */}
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-neutral-400">
                  Переключить аккаунт
                </div>
                <ul className="max-h-72 overflow-y-auto pb-2">
                  {accounts.map((u) => {
                    const active = u.id === currentUser.id;
                    return (
                      <li key={u.id}>
                        <button
                          role="menuitemradio"
                          aria-checked={active}
                          onClick={() => { switchAccount(u.id); setOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-neutral-800 ${active ? "bg-gray-50 dark:bg-neutral-800/60" : ""}`}
                        >
                          <Avatar src={u.image} sizeClass="w-10 h-10" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-sm font-semibold text-black dark:text-white">
                              <span className="truncate">{u.firstName} {u.lastName}</span>
                              {u.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-neutral-400 truncate">@{u.username}</div>
                          </div>
                          <span
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? "border-sky-500 bg-sky-500" : "border-gray-300 dark:border-neutral-600"}`}
                          >
                            {active && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12l5 5L20 7" />
                              </svg>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
