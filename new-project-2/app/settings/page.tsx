"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import BackBar from "@/components/BackBar";
import PostSkeleton from "@/components/PostSkeleton";
import { cardClass, inputClass, labelClass, primaryBtn } from "@/lib/ui";

// Настройки профиля (адрес /settings)
export default function SettingsPage() {
  const router = useRouter();
  const { ready, currentUser, updateUser } = useContext(AppContext);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [loadedFor, setLoadedFor] = useState<number | null>(null);

  // Поля заполняются данными текущего аккаунта (и обновляются при смене аккаунта)
  useEffect(() => {
    if (!ready || loadedFor === currentUser.id) return;
    setFirstName(currentUser.firstName);
    setLastName(currentUser.lastName);
    setBio(currentUser.bio);
    setLoadedFor(currentUser.id);
  }, [ready, currentUser, loadedFor]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    updateUser(currentUser.id, firstName.trim(), lastName.trim(), bio);
    router.push(`/u/${currentUser.username}`);
  };

  return (
    <div className={cardClass}>
      <BackBar />
      {!ready ? (
        <PostSkeleton />
      ) : (
        <form onSubmit={submit} className="p-5 flex flex-col gap-4 max-w-lg mx-auto">
          <div>
            <h1 className="text-2xl font-black text-black dark:text-white">Настройки профиля</h1>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Изменения сохраняются в вашем браузере.</p>
          </div>

          <div className="flex items-center gap-4">
            <Avatar src={currentUser.image} sizeClass="w-16 h-16" />
            <div>
              <div className="font-bold text-black dark:text-white">@{currentUser.username}</div>
              <div className="text-xs text-gray-500 dark:text-neutral-400">Имя пользователя изменить нельзя</div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelClass} htmlFor="st-first">Имя</label>
              <input id="st-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={30} className={`${inputClass} font-medium`} />
            </div>
            <div className="flex-1">
              <label className={labelClass} htmlFor="st-last">Фамилия</label>
              <input id="st-last" value={lastName} onChange={(e) => setLastName(e.target.value)} required maxLength={30} className={`${inputClass} font-medium`} />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="st-bio">О себе</label>
            <textarea id="st-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} className={`${inputClass} min-h-[100px] resize-none`} />
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" className={primaryBtn}>Сохранить</button>
          </div>
        </form>
      )}
    </div>
  );
}
