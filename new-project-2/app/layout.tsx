import "./globals.css";
import React from "react";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";

export const metadata = {
  title: "SecretSpace",
  description: "Минималистичная социальная сеть",
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
          <Header />
          <main className="max-w-2xl mx-auto min-h-screen pb-20">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}