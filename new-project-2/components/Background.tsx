"use client";
import React, { useEffect, useRef } from "react";

interface Ribbon {
  id: string;
  d: string; // контур ленты
  text: string; // повторяющаяся надпись
  speed: number; // скорость и направление движения текста при прокрутке
  gradient?: boolean; // цветная лента (как фиолетово-оранжевая в Threads)
}

// Повторов должно хватать, чтобы текст покрывал всю длину ленты
const REPEATS = 22;
const RIBBON_WIDTH = 84;
// Чем меньше число, тем плавнее и «тягучее» движение (от 0.03 до 0.2)
const SMOOTHING = 0.06;

const RIBBONS: Ribbon[] = [
  {
    id: "r1",
    d: "M -120 120 C 300 -80, 700 380, 420 420 C 140 460, 260 120, 620 160 C 980 200, 1100 640, 1560 520",
    text: "SECRETSPACE",
    speed: 0.35,
  },
  {
    id: "r2",
    d: "M 1560 40 C 1100 -80, 900 360, 1180 400 C 1460 440, 1260 780, 900 740 C 540 700, 460 980, -120 840",
    text: "KEEP IN SECRET",
    speed: -0.3,
  },
  {
    id: "r3",
    d: "M 200 -100 C 80 300, 560 300, 360 620 C 200 880, -100 700, 120 1000",
    text: "WHO ARE YOU?",
    speed: 0.25,
  },
  {
    id: "r4",
    d: "M -120 560 C 300 800, 560 280, 880 460 C 1200 640, 1000 960, 700 880 C 400 800, 760 330, 1560 800",
    text: "REVEAL YOURSELF",
    speed: -0.4,
    gradient: true,
  },
];

const unit = (text: string) => `${text}  •  `;

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

    // Текст не прыгает за скроллом, а догоняет его с инерцией: движение получается плавным
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
        {RIBBONS.map((r) => (
          <path key={r.id} id={r.id} d={r.d} />
        ))}
      </defs>

      {/* Тело лент */}
      <g fill="none" strokeWidth={RIBBON_WIDTH} strokeLinecap="round">
        {RIBBONS.map((r) =>
          r.gradient ? (
            <path key={r.id} d={r.d} stroke="url(#ribbon-gradient)" />
          ) : (
            <path key={r.id} d={r.d} className="stroke-neutral-950 dark:stroke-neutral-800" />
          )
        )}
      </g>

      {/* Надписи вдоль лент */}
      {RIBBONS.map((r, i) => (
        <text
          key={r.id}
          ref={(el) => {
            textRefs.current[i] = el;
          }}
          dy="0.35em"
          className="fill-white"
          style={{
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: 2,
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
      ))}
    </svg>
  );
}

export default React.memo(Background);
