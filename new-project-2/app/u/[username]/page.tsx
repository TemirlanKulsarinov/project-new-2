"use client";
import React, { useContext, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import BackBar from "@/components/BackBar";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import ModeratorBadge from "@/components/ModeratorBadge";
import { cardClass } from "@/lib/ui";
import { plural } from "@/lib/format";

// Профиль пользователя (адрес /u/имя)
export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const { ready, posts, users, currentUser, isModerator } = useContext(AppContext);

  const username = decodeURIComponent(params.username ?? "").toLowerCase();
  const profileUser = Object.values(users).find((u) => u.username.toLowerCase() === username);
  const profileId = profileUser?.id;

  // Чужие анонимные посты видит только модератор
  const profilePosts = useMemo(
    () =>
      profileId
        ? posts
            .filter((p) => p.userId === profileId && (!p.isAnonymous || p.userId === currentUser.id || isModerator))
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [posts, profileId, currentUser.id, isModerator]
  );

  const stats = useMemo(() => {
    if (!profileId) return null;
    return {
      posts: profilePosts.length,
      likes: profilePosts.reduce((sum, p) => sum + p.likes, 0),
      comments: posts.reduce((sum, p) => sum + p.comments.filter((c) => c.userId === profileId).length, 0),
    };
  }, [profileId, profilePosts, posts]);

  if (!ready) {
    return (
      <div className={cardClass}>
        <BackBar />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (!profileUser || !stats) {
    return (
      <div className={`${cardClass} p-10 text-center`}>
        <h1 className="text-xl font-black text-black dark:text-white mb-2">Пользователь не найден</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">Аккаунта @{username} не существует.</p>
        <Link href="/" className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full text-sm font-bold">
          В ленту
        </Link>
      </div>
    );
  }

  return (
    <div className={`${cardClass} min-h-screen`}>
      <BackBar>
        {profileUser.id === currentUser.id && (
          <Link
            href="/settings"
            className="bg-gray-100 dark:bg-neutral-800 text-black dark:text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
          >
            Редактировать
          </Link>
        )}
      </BackBar>

      <div className="p-8 text-center border-b border-gray-200 dark:border-neutral-800">
        <div className="mx-auto mb-4 w-32 h-32">
          <Avatar src={profileUser.image} sizeClass="w-32 h-32" className="border-4 shadow-md" />
        </div>
        <h1 className="text-2xl font-black text-black dark:text-white flex items-center justify-center gap-2">
          {profileUser.firstName} {profileUser.lastName}
          {profileUser.verified && <VerifiedBadge className="w-5 h-5" />}
        </h1>
        <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">@{profileUser.username}</p>
        {profileUser.role === "moderator" && <ModeratorBadge className="mb-4" />}
        <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 max-w-md mx-auto shadow-inner border border-gray-200 dark:border-neutral-800 whitespace-pre-wrap">
          {profileUser.bio || "Пока ничего не рассказал о себе."}
        </div>

        <div className="mt-6 flex justify-center gap-8">
          {[
            { value: stats.posts, label: plural(stats.posts, ["пост", "поста", "постов"]) },
            { value: stats.likes, label: plural(stats.likes, ["лайк", "лайка", "лайков"]) },
            { value: stats.comments, label: plural(stats.comments, ["комментарий", "комментария", "комментариев"]) },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-xl font-black text-black dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-neutral-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-lg font-bold p-5 border-b border-gray-200 dark:border-neutral-800 text-black dark:text-white">
        Посты пользователя
      </h2>
      <div className="flex flex-col pb-6">
        {profilePosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {profilePosts.length === 0 && (
          <p className="text-center text-gray-500 dark:text-neutral-500 py-10">Нет доступных постов.</p>
        )}
      </div>
    </div>
  );
}
