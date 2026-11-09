import React from "react";

interface AvatarProps {
  src: string;
  alt?: string;
  /** Tailwind-классы размера, например "w-11 h-11" */
  sizeClass?: string;
  className?: string;
}

// Круглый аватар. Фон задан самой картинкой (параметр backgroundColor),
// а масштаб рисунка уменьшен (scale), поэтому ничего не обрезается.
export default function Avatar({ src, alt = "avatar", sizeClass = "w-11 h-11", className = "" }: AvatarProps) {
  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex-shrink-0 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-full object-cover" draggable={false} />
    </div>
  );
}
