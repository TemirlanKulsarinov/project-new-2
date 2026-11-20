"use client";
import React, { useContext } from "react";
import Link from "next/link";
import { AppContext, User } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import BackBar from "@/components/BackBar";
import FollowButton from "@/components/FollowButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import { cardClass } from "@/lib/ui";
import { plural } from "@/lib/format";

function AccountRow({ user, followers }: { user: User; followers: number }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 dark:border-neutral-800">
      <Link href={`/u/${user.username}`} aria-label={`Профиль ${user.username}`} className="shrink-0">
        <Avatar src={user.image} sizeClass="w-12 h-12" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/u/${user.username}`} className="flex items-center gap-1 font-bold text-black hover:underline dark:text-white">
          <span className="truncate">{user.firstName} {user.lastName}</span>
          {user.verified && <VerifiedBadge className="w-4 h-4 shrink-0" />}
        </Link>
        <p className="truncate text-sm text-gray-500 dark:text-neutral-400">@{user.username}</p>
        <p className="text-xs text-gray-400 dark:text-neutral-500">
          {followers} {plural(followers, ["подписчик", "подписчика", "подписчиков"])}
        </p>
      </div>
      <FollowButton userId={user.id} />
    </div>
  );
}

export default function FollowingPage() {
  const { ready, users, currentUser, followingIds, followerCounts, blockedUserIds, blockedByUserIds } = useContext(AppContext);
  const followedUsers = followingIds
    .map((id) => users[id])
    .filter(
      (user): user is User =>
        !!user && !blockedUserIds.includes(user.id) && !blockedByUserIds.includes(user.id)
    );
  const suggestions = Object.values(users)
    .filter(
      (user) =>
        user.id !== currentUser.id &&
        !followingIds.includes(user.id) &&
        !blockedUserIds.includes(user.id) &&
        !blockedByUserIds.includes(user.id)
    )
    .sort((a, b) => (followerCounts[b.id] ?? 0) - (followerCounts[a.id] ?? 0))
    .slice(0, 8);

  return (
    <div className={cardClass}>
      <BackBar label="В ленту" />
      <div className="border-b border-gray-200 px-5 py-5 dark:border-neutral-800">
        <h1 className="text-2xl font-black text-black dark:text-white">Подписки</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
          Подписывайтесь на авторов. В персональной ленте показываются только их раскрытые посты — анонимные публикации остаются анонимными.
        </p>
      </div>

      {!ready ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-neutral-400">Загружаем подписки…</div>
      ) : (
        <>
          <section aria-labelledby="following-heading">
            <h2 id="following-heading" className="border-b border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 dark:border-neutral-800 dark:text-gray-200">
              Вы подписаны · {followedUsers.length}
            </h2>
            {followedUsers.length ? (
              followedUsers.map((user) => (
                <AccountRow key={user.id} user={user} followers={followerCounts[user.id] ?? 0} />
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-gray-500 dark:text-neutral-400">
                Пока нет подписок. Найдите интересных авторов в рекомендациях ниже.
              </p>
            )}
          </section>

          <section aria-labelledby="suggestions-heading">
            <h2 id="suggestions-heading" className="border-y border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 dark:border-neutral-800 dark:text-gray-200">
              Кого читать
            </h2>
            {suggestions.length ? (
              suggestions.map((user) => (
                <AccountRow key={user.id} user={user} followers={followerCounts[user.id] ?? 0} />
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-gray-500 dark:text-neutral-400">
                Вы уже подписаны на всех авторов.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
