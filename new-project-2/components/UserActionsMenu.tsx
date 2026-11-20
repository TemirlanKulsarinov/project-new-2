"use client";
import React, { useCallback, useContext, useRef, useState } from "react";
import { AppContext } from "@/context/AppContext";
import ReportDialog from "@/components/ReportDialog";
import { useDismiss } from "@/lib/useModal";

export default function UserActionsMenu({ userId, username }: { userId: number; username: string }) {
  const { currentUser, blockedUserIds, accountReports, blockUser, unblockUser, reportUser } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  if (userId === currentUser.id) return null;

  const blocked = blockedUserIds.includes(userId);
  const reported = accountReports.some(
    (report) => report.reporterId === currentUser.id && report.targetUserId === userId
  );

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={`Действия с профилем @${username}`}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
        {open && (
          <div
            role="menu"
            className="account-menu absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <button
              type="button"
              role="menuitem"
              disabled={reported}
              onClick={() => {
                close();
                setReportOpen(true);
              }}
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-amber-700 hover:bg-gray-50 disabled:cursor-default disabled:opacity-60 dark:text-amber-400 dark:hover:bg-neutral-800"
            >
              {reported ? "Жалоба отправлена" : "Пожаловаться на профиль"}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                if (blocked) {
                  unblockUser(userId);
                } else if (window.confirm(`Заблокировать @${username}? Его публикации и комментарии будут скрыты.`)) {
                  blockUser(userId);
                }
              }}
              className="block w-full border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-800"
            >
              {blocked ? "Разблокировать" : "Заблокировать"}
            </button>
          </div>
        )}
      </div>
      {reportOpen && (
        <ReportDialog
          title={`Пожаловаться на @${username}`}
          onClose={() => setReportOpen(false)}
          onSubmit={(reason) => {
            reportUser(userId, reason);
            setReportOpen(false);
          }}
        />
      )}
    </>
  );
}
