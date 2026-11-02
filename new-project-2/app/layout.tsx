import "./globals.css";
import React from "react";
import { AppProvider } from "@/context/AppContext";

export const metadata = {
  title: "SecretSpace",
  description: "Анонимная социальная сеть на Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <AppProvider>
          <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-purple-100 shadow-sm">
            <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-black tracking-tight gradient-text">
                SecretSpace
              </h1>
              <div className="text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                Поделись ➔ Набери 5 лайков ➔ Раскройся
              </div>
            </div>
          </header>
          <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}