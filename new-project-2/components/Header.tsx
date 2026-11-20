"use client";
import React, { useCallback, useContext, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppContext, FEED_PREFS_KEY } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import ModeratorBadge from "@/components/ModeratorBadge";
import NotificationsBell from "@/components/NotificationsBell";
import { useDismiss } from "@/lib/useModal";

const iconBtn =
  "w-10 h-10 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition";

export default function Header() {
  const {
    ready, users, posts, currentUser, isModerator, switchAccount, theme, toggleTheme, resetData,
  } = useContext(AppContext);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, menuRef);

  const accounts = Object.values(users);
  const pendingReports =
    posts.filter((p) => p.reports.length > 0).length +
    posts.reduce((sum, p) => sum + p.comments.filter((c) => c.reports.length > 0).length, 0);

  // Клик по логотипу полностью перезагружает страницу: лента обновляется, фильтры сбрасываются
  const onLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem(FEED_PREFS_KEY);
    } catch {}
    if (pathname === "/") window.location.reload();
    else window.location.assign("/");
  };

  return (
    <header className="bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 dark:border-neutral-800 transition-colors">
      <div className="h-16 px-4 sm:px-6 flex justify-between items-center gap-3">
        {/* Логотип в левом углу */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          onClick={onLogoClick}
          aria-label="SecretSpace: обновить ленту"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-black dark:text-white hover:opacity-70 transition flex-shrink-0"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-500 flex items-center justify-center" aria-hidden>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="9" r="3.6" />
              <path d="M7 19l1.7-5h6.6L17 19z" />
            </svg>
          </span>
          <span className="hidden sm:inline">SecretSpace</span>
        </a>

        <div className="flex items-center gap-1">
          {/* Переключатель темы */}
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === "dark"}
            aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
            className={`relative w-[58px] h-8 mr-1 rounded-full overflow-hidden flex-shrink-0 transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              theme === "dark"
                ? "bg-gradient-to-br from-indigo-950 to-violet-900"
                : "bg-gradient-to-br from-sky-300 to-amber-200"
            }`}
          >
            <span className={`absolute inset-0 transition-opacity duration-500 ${theme === "dark" ? "opacity-100" : "opacity-0"}`}>
              <span className="absolute left-2 top-2 w-[3px] h-[3px] rounded-full bg-white/90" />
              <span className="absolute left-4 top-5 w-0.5 h-0.5 rounded-full bg-white/70" />
              <span className="absolute left-3 top-[22px] w-[3px] h-[3px] rounded-full bg-white/60" />
            </span>
            <span className={`absolute inset-0 transition-opacity duration-500 ${theme === "dark" ? "opacity-0" : "opacity-100"}`}>
              <span className="absolute right-2 bottom-1.5 w-4 h-2 rounded-full bg-white/80" />
              <span className="absolute right-4 bottom-3 w-3 h-1.5 rounded-full bg-white/60" />
            </span>
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

          {!ready ? (
            <div className="w-28 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 animate-pulse" />
          ) : (
            <>
              <Link href="/new" aria-label="Создать пост" title="Создать пост" className={iconBtn}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Link>
              <Link
                href="/saved"
                aria-label="Сохранённое"
                title="Сохранённое"
                className={`${iconBtn} ${pathname === "/saved" ? "text-amber-500 dark:text-amber-400" : ""}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={pathname === "/saved" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
              </Link>
              <NotificationsBell />

              <div className="relative ml-1" ref={menuRef}>
                <button
                  onClick={() => setOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-label="Меню аккаунта"
                  className="flex items-center gap-2 p-1 sm:pr-3 rounded-full border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                >
                  <Avatar src={currentUser.image} sizeClass="w-8 h-8" />
                  <span className="hidden sm:inline text-sm font-semibold text-gray-900 dark:text-gray-100 max-w-[90px] truncate">
                    {currentUser.firstName}
                  </span>
                  <svg
                    className={`hidden sm:block w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
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
                        {isModerator && <ModeratorBadge className="mt-1" />}
                      </div>
                    </div>

                    {[
                      { href: `/u/${currentUser.username}`, label: "Мой профиль" },
                      { href: "/saved", label: "Сохранённое" },
                      { href: "/settings", label: "Настройки профиля" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        role="menuitem"
                        href={item.href}
                        onClick={close}
                        className="block px-4 py-3 text-sm font-semibold text-black dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                      >
                        {item.label}
                      </Link>
                    ))}
                    {isModerator && (
                      <Link
                        role="menuitem"
                        href="/moderation"
                        onClick={close}
                        className="px-4 py-3 text-sm font-semibold text-black dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-800 transition flex items-center justify-between border-t border-gray-100 dark:border-neutral-800"
                      >
                        Панель модерации
                        {pendingReports > 0 && (
                          <span className="text-xs font-bold bg-red-500 text-white rounded-full px-2 py-0.5">{pendingReports}</span>
                        )}
                      </Link>
                    )}

                    {/* Список аккаунтов */}
                    <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-neutral-400 border-t border-gray-100 dark:border-neutral-800">
                      Переключить аккаунт
                    </div>
                    <ul className="max-h-64 overflow-y-auto pb-1">
                      {accounts.map((u) => {
                        const active = u.id === currentUser.id;
                        return (
                          <li key={u.id}>
                            <button
                              role="menuitemradio"
                              aria-checked={active}
                              onClick={() => { switchAccount(u.id); close(); }}
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

                    <div className="border-t border-gray-100 dark:border-neutral-800">
                      <Link
                        role="menuitem"
                        href="/register"
                        onClick={close}
                        className="block px-4 py-3 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                      >
                        + Создать аккаунт
                      </Link>
                      <button
                        role="menuitem"
                        onClick={() => {
                          if (window.confirm("Сбросить все данные сайта (посты, комментарии, аккаунты) к исходным?")) resetData();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-gray-500 dark:text-neutral-500 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                      >
                        Сбросить демо-данные
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
