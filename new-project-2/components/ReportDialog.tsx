"use client";
import React, { useState } from "react";
import { REPORT_REASONS } from "@/context/AppContext";
import { useModal } from "@/lib/useModal";
import { primaryBtn, ghostBtn } from "@/lib/ui";

interface ReportDialogProps {
  title: string; // например «Пожаловаться на пост»
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

// Окно выбора причины жалобы (для постов и комментариев)
export default function ReportDialog({ title, onSubmit, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState("");
  useModal(true, onClose);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-panel bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center text-black dark:text-white">
          <h2 className="font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Закрыть" className="text-gray-400 hover:text-black dark:hover:text-white text-xl">✕</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reason) onSubmit(reason);
          }}
          className="p-5 flex flex-col gap-3"
        >
          <p className="text-sm text-gray-500 dark:text-neutral-400">Выберите причину. Жалобу увидит только модератор.</p>
          <div className="flex flex-col gap-2" role="radiogroup">
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-colors ${
                  reason === r
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-black dark:text-white"
                    : "border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
                }`}
              >
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-purple-600" />
                {r}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={ghostBtn}>Отмена</button>
            <button type="submit" disabled={!reason} className={`${primaryBtn} !px-6 !py-2 text-sm`}>Отправить</button>
          </div>
        </form>
      </div>
    </div>
  );
}
