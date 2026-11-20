"use client";
import React, { useEffect, useRef } from "react";

interface Ribbon {
  id: string;
  d: string; // контур ленты (простая плавная кривая без самопересечений)
  text: string; // повторяющаяся надпись
  speed: number; // скорость и направление движения текста при прокрутке
  tone: "a" | "b" | "gradient"; // оттенок ленты
}

// Повторов с запасом хватает, чтобы текст покрывал всю длину ленты
const REPEATS = 9;
const RIBBON_WIDTH = 84;
const HALO_WIDTH = 116; // светлая обводка: чётко отделяет верхнюю ленту от нижней
// Чем меньше число, тем плавнее и «тягучее» движение (от 0.03 до 0.2)
const SMOOTHING = 0.06;

// Порядок в массиве = порядок наложения: каждая следующая лента лежит поверх предыдущих.
// Надпись принадлежит своей ленте, поэтому нижние ленты перекрываются верхними вместе с текстом.
const RIBBONS: Ribbon[] = [
  { id: "r1", d: "M -200 780 C 150 980, 430 600, 770 620 S 1280 860, 1640 600", text: "SECRETSPACE", speed: 0.35, tone: "a" },
  { id: "r2", d: "M -200 90 C 280 -140, 640 300, 960 170 S 1380 -60, 1640 120", text: "KEEP IN SECRET", speed: -0.3, tone: "b" },
  { id: "r3", d: "M 300 -200 C 140 220, 560 360, 440 700 S 320 1000, 560 1100", text: "WHO ARE YOU?", speed: 0.25, tone: "a" },
  { id: "r4", d: "M 1220 -200 C 1420 220, 1020 440, 1140 760 S 1320 1000, 1120 1100", text: "NO ONE KNOWS", speed: -0.28, tone: "b" },
  { id: "r5", d: "M -200 430 C 220 560, 560 240, 900 300 S 1320 520, 1640 760", text: "DON'T TELL ANYONE", speed: 0.32, tone: "a" },
  { id: "r6", d: "M -200 540 C 260 320, 560 860, 920 640 S 1320 240, 1640 380", text: "REVEAL YOURSELF", speed: -0.4, tone: "gradient" },
];

const unit = (text: string) => `${text}  •  `;

const toneClass: Record<Ribbon["tone"], string> = {
  a: "stroke-neutral-950 dark:stroke-neutral-800",
  b: "stroke-zinc-900 dark:stroke-neutral-700",
  gradient: "",
};

function Background() {
  const textRefs = useRef<(SVGTextElement | null)[]>([]);
  const pathRefs = useRef<(SVGTextPathElement | null)[]>([]);
  const periods = useRef<number[]>([]);

  useEffect(() => {
    let frame = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Длина одного повтора надписи нужна, чтобы движение зацикливалось без скачков
    const measure = () => {
      periods.current = RIBBONS.map((_, i) => {
        const el = textRefs.current[i];
        return el && typeof el.getComputedTextLength === "function" ? el.getComputedTextLength() / REPEATS : 0;
      });
    };

    // Текст догоняет прокрутку с инерцией: движение получается плавным
    let current = reduceMotion ? 0 : window.scrollY;
    let target = current;

    const render = () => {
      RIBBONS.forEach((r, i) => {
        const period = periods.current[i];
        const tp = pathRefs.current[i];
        if (!tp || !period) return;
        const shift = (((current * r.speed) % period) + period) % period;
        tp.setAttribute("startOffset", String(shift - period));
      });
    };

    const tick = () => {
      frame = 0;
      current += (target - current) * SMOOTHING;
      if (Math.abs(target - current) < 0.1) current = target;
      render();
      if (current !== target) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = reduceMotion ? 0 : window.scrollY;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    measure();
    render();
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        measure();
        render();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <svg
      aria-hidden
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="ribbon-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1440" y2="0">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="0.5" stopColor="#d946ef" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>

      {/* Каждая лента рисуется целиком (обводка, тело, текст), затем следующая поверх неё */}
      {RIBBONS.map((r, i) => (
        <g key={r.id} fill="none" strokeLinecap="butt">
          <path d={r.d} strokeWidth={HALO_WIDTH} className="stroke-gray-100 dark:stroke-neutral-950" />
          <path
            id={r.id}
            d={r.d}
            strokeWidth={RIBBON_WIDTH}
            className={toneClass[r.tone]}
            stroke={r.tone === "gradient" ? "url(#ribbon-gradient)" : undefined}
          />
          <text
            ref={(el) => {
              textRefs.current[i] = el;
            }}
            dy="0.35em"
            className="fill-white"
            stroke="none"
            style={{
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: 3,
              whiteSpace: "pre",
              fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            <textPath
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              href={`#${r.id}`}
              startOffset={0}
            >
              {unit(r.text).repeat(REPEATS)}
            </textPath>
          </text>
        </g>
      ))}
    </svg>
  );
}

export default React.memo(Background);
