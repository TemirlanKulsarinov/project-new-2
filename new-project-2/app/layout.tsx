import "./globals.css";
import React from "react";
import type { Viewport } from "next";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";
import PostModal from "@/components/PostModal";
import RegisterModal from "@/components/RegisterModal";
import Toasts from "@/components/Toasts";

export const metadata = {
  title: "SecretSpace — анонимные мысли, раскрытие за лайки",
  description:
    "Минималистичная социальная сеть с механикой анонимности: автор поста раскрывается, когда пост наберёт нужное число лайков.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Ставит тёмную тему до первой отрисовки, чтобы страница не мигала белым
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('secretspace-theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppProvider>
          <Header />
          <main className="max-w-2xl mx-auto min-h-screen pb-10">{children}</main>
          <footer className="relative z-10 max-w-2xl mx-auto px-4 pb-10 text-center text-xs text-gray-500 dark:text-neutral-500">
            <span className="bg-white/80 dark:bg-black/70 backdrop-blur px-3 py-1.5 rounded-full inline-block">
              SecretSpace · демо-проект. Данные хранятся только в вашем браузере.
            </span>
          </footer>
          <PostModal />
          <RegisterModal />
          <Toasts />
        </AppProvider>
      </body>
    </html>
  );
}
