"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import ModeratorBadge from "@/components/ModeratorBadge";

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
          {/* Переключатель темы */}
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === "dark"}
            aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
            className={`relative w-[58px] h-8 rounded-full overflow-hidden flex-shrink-0 transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              theme === "dark"
                ? "bg-gradient-to-br from-indigo-950 to-violet-900"
                : "bg-gradient-to-br from-sky-300 to-amber-200"
            }`}
          >
            {/* Звёзды (видны в тёмной теме) */}
            <span className={`absolute inset-0 transition-opacity duration-500 ${theme === "dark" ? "opacity-100" : "opacity-0"}`}>
              <span className="absolute left-2 top-2 w-[3px] h-[3px] rounded-full bg-white/90" />
              <span className="absolute left-4 top-5 w-0.5 h-0.5 rounded-full bg-white/70" />
              <span className="absolute left-3 top-[22px] w-[3px] h-[3px] rounded-full bg-white/60" />
            </span>
            {/* Облака (видны в светлой теме) */}
            <span className={`absolute inset-0 transition-opacity duration-500 ${theme === "dark" ? "opacity-0" : "opacity-100"}`}>
              <span className="absolute right-2 bottom-1.5 w-4 h-2 rounded-full bg-white/80" />
              <span className="absolute right-4 bottom-3 w-3 h-1.5 rounded-full bg-white/60" />
            </span>

            {/* Ползунок с иконкой */}
            <span
              className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
                theme === "dark" ? "translate-x-[26px] bg-slate-100 text-indigo-900" : "translate-x-0 bg-amber-400 text-white"
              }`}
            >
              {theme === "dark" ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              )}
            </span>
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
                    {currentUser.role === "moderator" && <ModeratorBadge className="mt-1" />}
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
                              {u.role === "moderator" && (
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 rounded-full">MOD</span>
                              )}
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