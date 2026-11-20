"use client";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import BackBar from "@/components/BackBar";
import TimeAgo from "@/components/TimeAgo";
import { cardClass, inputClass } from "@/lib/ui";

export default function ConversationPage() {
  const { username: routeUsername } = useParams<{ username: string }>();
  const username = decodeURIComponent(routeUsername ?? "").toLowerCase();
  const { ready, currentUser, users, messages, blockedUserIds, blockedByUserIds, sendMessage } = useContext(AppContext);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const recipient = Object.values(users).find((user) => user.username.toLowerCase() === username);
  const conversation = useMemo(
    () =>
      recipient
        ? messages
            .filter(
              (message) =>
                (message.fromUserId === currentUser.id && message.toUserId === recipient.id) ||
                (message.fromUserId === recipient.id && message.toUserId === currentUser.id)
            )
            .sort((a, b) => a.createdAt - b.createdAt)
        : [],
    [currentUser.id, messages, recipient]
  );
  const blockedByMe = recipient ? blockedUserIds.includes(recipient.id) : false;
  const blockedMe = recipient ? blockedByUserIds.includes(recipient.id) : false;
  const blocked = blockedByMe || blockedMe;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length]);

  if (!ready) {
    return <div className={`${cardClass} p-10 text-center text-gray-500 dark:text-neutral-400`}>Загружаем переписку…</div>;
  }

  if (!recipient || recipient.id === currentUser.id) {
    return (
      <div className={`${cardClass} p-10 text-center`}>
        <h1 className="mb-2 text-xl font-black text-black dark:text-white">Пользователь не найден</h1>
        <Link href="/messages" className="text-sm font-bold text-purple-600 hover:underline dark:text-purple-400">К сообщениям</Link>
      </div>
    );
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (sendMessage(recipient.id, text)) setText("");
  };

  return (
    <div className={cardClass}>
      <BackBar label="Сообщения" fallback="/messages" />
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-neutral-800">
        <Avatar src={recipient.image} sizeClass="w-10 h-10" />
        <div className="min-w-0 flex-1">
          <Link href={`/u/${recipient.username}`} className="block truncate font-bold text-black hover:underline dark:text-white">
            {recipient.firstName} {recipient.lastName}
          </Link>
          <span className="text-sm text-gray-500 dark:text-neutral-400">@{recipient.username}</span>
        </div>
        <Link href={`/u/${recipient.username}`} className="text-sm font-semibold text-purple-600 hover:underline dark:text-purple-400">
          Профиль
        </Link>
      </div>

      <div className="flex max-h-[60vh] min-h-[35vh] flex-col gap-3 overflow-y-auto p-5">
        {conversation.length === 0 && (
          <p className="m-auto text-center text-sm text-gray-500 dark:text-neutral-400">
            Начните переписку с @
            {recipient.username}.
          </p>
        )}
        {conversation.map((message) => {
          const own = message.fromUserId === currentUser.id;
          return (
            <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                own
                  ? "rounded-br-md bg-purple-600 text-white"
                  : "rounded-bl-md bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-gray-100"
              }`}>
                <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                <TimeAgo ts={message.createdAt} className={`mt-1 block text-right text-[11px] ${own ? "text-purple-100" : "text-gray-400 dark:text-neutral-500"}`} />
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {blocked ? (
        <div className="border-t border-gray-200 p-4 text-center text-sm text-amber-700 dark:border-neutral-800 dark:text-amber-400">
          {blockedByMe
            ? "Вы заблокировали этого пользователя. Разблокируйте его в меню профиля, чтобы продолжить переписку."
            : "Этот пользователь ограничил переписку с вами."}
        </div>
      ) : (
        <form onSubmit={submit} className="flex items-end gap-3 border-t border-gray-200 p-4 dark:border-neutral-800">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Напишите сообщение…"
            maxLength={1000}
            rows={2}
            className={`${inputClass} min-h-12 resize-none text-sm`}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="shrink-0 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-40 dark:bg-white dark:text-black"
          >
            Отправить
          </button>
        </form>
      )}
    </div>
  );
}
