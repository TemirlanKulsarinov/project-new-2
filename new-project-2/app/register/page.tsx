"use client";
import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext, avatarFor } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import BackBar from "@/components/BackBar";
import { cardClass, inputClass, labelClass, primaryBtn } from "@/lib/ui";

// Создание аккаунта (адрес /register)
export default function RegisterPage() {
  const router = useRouter();
  const { ready, registerUser } = useContext(AppContext);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerUser({ username, firstName, lastName, bio });
    if (result.ok) router.push(`/u/${result.username}`);
    else setError(result.error);
  };

  const preview = avatarFor(username.trim().toLowerCase() || "new-user");

  return (
    <div className={cardClass}>
      <BackBar />
      <form onSubmit={submit} className="p-5 flex flex-col gap-4 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white">Создать аккаунт</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">После создания вы сразу войдёте в новый аккаунт.</p>
        </div>

        <div className="flex items-center gap-4">
          <Avatar src={preview} sizeClass="w-16 h-16" />
          <p className="text-sm text-gray-500 dark:text-neutral-400">Аватар создаётся автоматически по имени пользователя.</p>
        </div>

        <div>
          <label className={labelClass} htmlFor="reg-username">Имя пользователя</label>
          <input
            id="reg-username" value={username} autoFocus required maxLength={20} placeholder="например, alex.dev"
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            className={inputClass}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className={labelClass} htmlFor="reg-first">Имя</label>
            <input id="reg-first" value={firstName} required maxLength={30} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </div>
          <div className="flex-1">
            <label className={labelClass} htmlFor="reg-last">Фамилия</label>
            <input id="reg-last" value={lastName} required maxLength={30} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="reg-bio">О себе (по желанию)</label>
          <textarea id="reg-bio" value={bio} maxLength={200} onChange={(e) => setBio(e.target.value)} className={`${inputClass} min-h-[90px] resize-none`} />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-xl p-3">
            {error}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={!ready} className={primaryBtn}>Создать и войти</button>
        </div>
      </form>
    </div>
  );
}
