"use client";
import React, { useEffect, useRef } from "react";

interface RibbonConfig {
  text: string;
  top: string;
  rotate: number;
  speed: number;
}

const repeat = (text: string) => Array(20).fill(text).join(" • ");

const RIBBONS: RibbonConfig[] = [
  { text: repeat("THE WORLD IS YOURS"), top: "5%", rotate: -12, speed: 0.4 },
  { text: repeat("KEEP IN SECRET"), top: "22%", rotate: 10, speed: -0.5 },
  { text: repeat("NO ONE KNOWS"), top: "40%", rotate: -5, speed: 0.6 },
  { text: repeat("REVEAL YOURSELF"), top: "58%", rotate: 15, speed: -0.4 },
  { text: repeat("WHO ARE YOU?"), top: "76%", rotate: -10, speed: 0.5 },
  { text: repeat("DON'T TELL ANYONE"), top: "92%", rotate: 8, speed: -0.3 },
];

// Фон двигается напрямую через ref + requestAnimationFrame.
// Страница и все карточки постов больше не перерисовываются на каждый тик скролла.
function Background() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      RIBBONS.forEach((r, i) => {
        const el = refs.current[i];
        if (el) el.style.transform = `rotate(${r.rotate}deg) translateX(${y * r.speed}px)`;
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {RIBBONS.map((r, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute flex items-center justify-center will-change-transform"
          style={{ top: r.top, left: "-200%", width: "500%", transform: `rotate(${r.rotate}deg)` }}
        >
          <span className="text-[60px] md:text-[100px] font-black whitespace-nowrap text-black dark:text-white opacity-5 dark:opacity-10 uppercase leading-none">
            {r.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export default React.memo(Background);
