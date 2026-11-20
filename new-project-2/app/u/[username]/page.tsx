"use client";
import React, { useContext, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import BackBar from "@/components/BackBar";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import ModeratorBadge from "@/components/ModeratorBadge";
import FollowButton from "@/components/FollowButton";
import UserActionsMenu from "@/components/UserActionsMenu";
import TimeAgo from "@/components/TimeAgo";
import { cardClass } from "@/lib/ui";
import { plural } from "@/lib/format";

// Профиль пользователя (адрес /u/имя)
export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const { ready, posts, users, currentUser, isModerator, followerCounts, blockedUserIds, blockedByUserIds } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "reposts">("posts");

  const username = decodeURIComponent(params.username ?? "").toLowerCase();
  const profileUser = Object.values(users).find((u) => u.username.toLowerCase() === username);
  const profileId = profileUser?.id;
  const blockedByMe = profileId !== undefined && blockedUserIds.includes(profileId);
  const blockedMe = profileId !== undefined && blockedByUserIds.includes(profileId);
  const conversationBlocked = blockedByMe || blockedMe;
  const hideProfile = conversationBlocked && !isModerator;

  // Чужие анонимные посты видит только модератор
  const profilePosts = useMemo(
    () =>
      profileId
        && !hideProfile
        ? posts
            .filter((p) => p.userId === profileId && (!p.isAnonymous || p.userId === currentUser.id || isModerator))
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [posts, profileId, currentUser.id, isModerator, hideProfile]
  );
  const profileComments = useMemo(
    () =>
      profileId && !hideProfile
        ? posts
            .filter(
              (post) =>
                isModerator ||
                (!blockedUserIds.includes(post.userId) && !blockedByUserIds.includes(post.userId))
            )
            .flatMap((post) =>
              post.comments
                .filter(
                  (comment) =>
                    comment.userId === profileId &&
                    (isModerator ||
                      (!blockedUserIds.includes(comment.userId) && !blockedByUserIds.includes(comment.userId)))
                )
                .map((comment) => ({ post, comment }))
            )
            .sort((a, b) => b.comment.createdAt - a.comment.createdAt)
        : [],
    [posts, profileId, hideProfile, isModerator, blockedUserIds, blockedByUserIds]
  );
  const profileReposts = useMemo(
    () =>
      profileId && !hideProfile
        ? posts
            .filter(
              (post) =>
                post.repostedBy.includes(profileId) &&
                (isModerator ||
                  (!blockedUserIds.includes(post.userId) && !blockedByUserIds.includes(post.userId))) &&
                (profileId === currentUser.id || isModerator || post.userId !== profileId || !post.isAnonymous)
            )
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [posts, profileId, currentUser.id, hideProfile, isModerator, blockedUserIds, blockedByUserIds]
  );

  const stats = useMemo(() => {
    if (!profileId) return null;
    return {
      posts: profilePosts.length,
      likes: profilePosts.reduce((sum, p) => sum + p.likes, 0),
      comments: profileComments.length,
      followers: followerCounts[profileId] ?? 0,
    };
  }, [profileId, profilePosts, profileComments, followerCounts]);

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
        {profileUser.id === currentUser.id ? (
          <Link
            href="/settings"
            className="bg-gray-100 dark:bg-neutral-800 text-black dark:text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
          >
            Редактировать
          </Link>
        ) : <UserActionsMenu userId={profileUser.id} username={profileUser.username} />}
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
        {!hideProfile && (
          <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 max-w-md mx-auto shadow-inner border border-gray-200 dark:border-neutral-800 whitespace-pre-wrap">
            {profileUser.bio || "Пока ничего не рассказал о себе."}
          </div>
        )}

        {profileUser.id !== currentUser.id && !conversationBlocked ? (
          <div className="mt-4 flex justify-center gap-2">
            <FollowButton userId={profileUser.id} />
            <Link href={`/messages/${profileUser.username}`} className="rounded-full border border-gray-300 px-5 py-2 text-sm font-bold text-black hover:bg-gray-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800">
              Написать
            </Link>
          </div>
        ) : null}

        {!hideProfile && <div className="mt-6 flex justify-center gap-8">
          {[
            { value: stats.posts, label: plural(stats.posts, ["пост", "поста", "постов"]) },
            { value: stats.likes, label: plural(stats.likes, ["лайк", "лайка", "лайков"]) },
            { value: stats.comments, label: plural(stats.comments, ["комментарий", "комментария", "комментариев"]) },
            { value: stats.followers, label: plural(stats.followers, ["подписчик", "подписчика", "подписчиков"]) },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-xl font-black text-black dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-neutral-400">{s.label}</div>
            </div>
          ))}
        </div>}
      </div>

      <div role="tablist" aria-label="Публикации профиля" className="flex border-b border-gray-200 dark:border-neutral-800">
        {([
          ["posts", "Посты", stats.posts],
          ["comments", "Комментарии", stats.comments],
          ["reposts", "Репосты", profileReposts.length],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 border-b-2 px-2 py-4 text-sm font-bold transition-colors sm:px-4 ${
              activeTab === id
                ? "border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300"
                : "border-transparent text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            {label} <span className="ml-1 text-xs opacity-70">{count}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col pb-6">
        {hideProfile ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500 dark:text-neutral-400">
            {blockedByMe ? "Вы заблокировали этого пользователя. Разблокируйте его в меню профиля, чтобы видеть его публикации." : "Этот пользователь ограничил вам доступ к профилю."}
          </p>
        ) : activeTab === "posts" ? (
          profilePosts.length ? profilePosts.map((post) => <PostCard key={post.id} post={post} />) : (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-neutral-500">Пользователь пока не опубликовал постов.</p>
          )
        ) : activeTab === "comments" ? (
          profileComments.length ? profileComments.map(({ post, comment }) => (
            <article key={`${post.id}-${comment.id}`} className="border-b border-gray-200 px-5 py-4 dark:border-neutral-800">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
                <span>Комментарий к</span>
                <Link href={`/post/${post.id}`} className="font-semibold text-purple-700 hover:underline dark:text-purple-300">
                  {post.title || "публикации"}
                </Link>
                <TimeAgo ts={comment.createdAt} className="ml-auto" />
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200">{comment.text}</p>
            </article>
          )) : (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-neutral-500">Пользователь пока не оставлял комментариев.</p>
          )
        ) : profileReposts.length ? profileReposts.map((post) => <PostCard key={post.id} post={post} />) : (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-neutral-500">Пользователь пока не делал репостов.</p>
        )}
      </div>
    </div>
  );
}
