"use client";
import React, { useContext, useMemo } from "react";
import Link from "next/link";
import { AppContext, ChatMessage, User } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import BackBar from "@/components/BackBar";
import TimeAgo from "@/components/TimeAgo";
import { cardClass } from "@/lib/ui";

interface Conversation {
  user: User;
  lastMessage: ChatMessage;
}

export default function MessagesPage() {
  const { ready, currentUser, users, messages, blockedUserIds, blockedByUserIds } = useContext(AppContext);
  const conversations = useMemo(() => {
    const latestByUser = new Map<number, ChatMessage>();
    messages.forEach((message) => {
      if (message.fromUserId !== currentUser.id && message.toUserId !== currentUser.id) return;
      const userId = message.fromUserId === currentUser.id ? message.toUserId : message.fromUserId;
      const latest = latestByUser.get(userId);
      if (!latest || message.createdAt > latest.createdAt) latestByUser.set(userId, message);
    });

    return [...latestByUser.entries()]
      .map(([userId, lastMessage]): Conversation | null => {
        const user = users[userId];
        return user ? { user, lastMessage } : null;
      })
      .filter((conversation): conversation is Conversation => !!conversation)
      .sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);
  }, [currentUser.id, messages, users]);

  return (
    <div className={cardClass}>
      <BackBar label="В ленту" />
      <div className="border-b border-gray-200 px-5 py-4 dark:border-neutral-800">
        <h1 className="text-2xl font-black text-black dark:text-white">Сообщения</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">Личные переписки с другими пользователями.</p>
      </div>
      {!ready ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-neutral-400">Загружаем сообщения…</div>
      ) : conversations.length ? (
        conversations.map(({ user, lastMessage }) => {
          const blocked = blockedUserIds.includes(user.id) || blockedByUserIds.includes(user.id);
          return (
            <Link
              key={user.id}
              href={`/messages/${user.username}`}
              className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 transition hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              <Avatar src={user.image} sizeClass="w-12 h-12" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-bold text-black dark:text-white">{user.firstName} {user.lastName}</span>
                  <TimeAgo ts={lastMessage.createdAt} className="shrink-0 text-xs text-gray-400 dark:text-neutral-500" />
                </div>
                <p className="truncate text-sm text-gray-500 dark:text-neutral-400">
                  {blocked ? "Переписка ограничена блокировкой" : lastMessage.fromUserId === currentUser.id ? `Вы: ${lastMessage.text}` : lastMessage.text}
                </p>
              </div>
            </Link>
          );
        })
      ) : (
        <div className="px-5 py-14 text-center">
          <p className="mb-4 text-sm text-gray-500 dark:text-neutral-400">Пока нет переписок. Откройте профиль пользователя и нажмите «Написать».</p>
          <Link href="/following" className="inline-block rounded-full bg-black px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">
            Найти пользователей
          </Link>
        </div>
      )}
    </div>
  );
}
