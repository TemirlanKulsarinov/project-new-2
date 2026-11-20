"use client";
import React, { useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext, AppNotification } from "@/context/AppContext";
import TimeAgo from "@/components/TimeAgo";
import { useDismiss } from "@/lib/useModal";

export default function NotificationsBell() {
  const router = useRouter();
  const { notifications, unreadCount, users, posts, markNotificationsRead } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  const describe = (n: AppNotification) => {
    const post = posts.find((p) => p.id === n.postId);
    const title = post ? `«${post.title}»` : "";
    const from = n.fromUserId ? users[n.fromUserId]?.username : undefined;
    if (n.type === "reveal") return `Ваш пост ${title} раскрыт: он набрал нужное число лайков.`;
    if (n.type === "comment") return `@${from ?? "кто-то"} оставил комментарий к вашему посту ${title}.`;
    const what = n.commentId ? "комментарий в посте" : "пост";
    return `Жалоба на ${what} ${title}${from ? ` от @${from}` : ""}.`;
  };

  const dot: Record<AppNotification["type"], string> = {
    reveal: "bg-purple-500",
    comment: "bg-sky-500",
    report: "bg-red-500",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount ? `Уведомления: ${unreadCount} новых` : "Уведомления"}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 01-3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="account-menu absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800">
            <h2 className="font-bold text-black dark:text-white">Уведомления</h2>
            {unreadCount > 0 && (
              <button onClick={() => markNotificationsRead()} className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                Прочитать все
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-gray-500 dark:text-neutral-500">
                Пока ничего нет. Здесь появятся комментарии и раскрытия ваших постов.
              </li>
            )}
            {notifications.slice(0, 30).map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    markNotificationsRead(n.id);
                    router.push(`/post/${n.postId}`);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-gray-50 dark:hover:bg-neutral-800 transition ${n.read ? "" : "bg-purple-50/60 dark:bg-purple-900/10"}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? "bg-gray-300 dark:bg-neutral-700" : dot[n.type]}`} />
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-900 dark:text-gray-100 break-words">{describe(n)}</span>
                    <TimeAgo ts={n.createdAt} className="text-xs text-gray-400 dark:text-neutral-500" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
