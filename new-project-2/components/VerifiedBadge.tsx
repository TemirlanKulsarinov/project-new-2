import React from "react";

export default function VerifiedBadge({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} text-sky-500 flex-shrink-0 inline-block`} viewBox="0 0 24 24" fill="currentColor" aria-label="Подтверждённый аккаунт" role="img">
      <path d="M12 1.5l2.6 2 3.3-.2 1.1 3.1 2.8 1.8-.9 3.2.9 3.2-2.8 1.8-1.1 3.1-3.3-.2-2.6 2-2.6-2-3.3.2-1.1-3.1L2.2 14.6l.9-3.2-.9-3.2 2.8-1.8 1.1-3.1 3.3.2 2.6-2z" />
      <path d="M8.5 12.2l2.4 2.4 4.6-4.8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
