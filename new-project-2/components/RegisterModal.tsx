"use client";
import React, { useCallback, useContext, useState } from "react";
import { AppContext, avatarFor } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import { useModal } from "@/lib/useModal";

const fieldClass =
  "w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white rounded-xl p-3 outline-none focus:border-purple-500";

function RegisterForm() {
  const { registerUser, setRegisterOpen } = useContext(AppContext);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  const close = useCallback(() => setRegisterOpen(false), [setRegisterOpen]);
  useModal(true, close);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerUser({ username, firstName, lastName, bio });
    if (result.ok) close();
    else setError(result.error);
  };

  const preview = avatarFor(username.trim().toLowerCase() || "new-user");

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Создать аккаунт"
        className="modal-panel bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
          <h2 className="font-bold text-lg">Создать аккаунт</h2>
          <button onClick={close} aria-label="Закрыть" className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={preview} sizeClass="w-16 h-16" />
            <p className="text-sm text-gray-500 dark:text-neutral-400">Аватар создаётся автоматически по имени пользователя.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="reg-username">Имя пользователя</label>
            <input
              id="reg-username" value={username} autoFocus required maxLength={20} placeholder="например, alex.dev"
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              className={fieldClass}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="reg-first">Имя</label>
              <input id="reg-first" value={firstName} required maxLength={30} onChange={(e) => setFirstName(e.target.value)} className={fieldClass} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="reg-last">Фамилия</label>
              <input id="reg-last" value={lastName} required maxLength={30} onChange={(e) => setLastName(e.target.value)} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="reg-bio">О себе (по желанию)</label>
            <textarea id="reg-bio" value={bio} maxLength={200} onChange={(e) => setBio(e.target.value)} className={`${fieldClass} min-h-[80px] resize-none`} />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-xl p-3">
              {error}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-8 py-2.5 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Создать и войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterModal() {
  const { registerOpen } = useContext(AppContext);
  if (!registerOpen) return null;
  return <RegisterForm />;
}
