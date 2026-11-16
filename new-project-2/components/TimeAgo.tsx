"use client";
import React, { useEffect, useState } from "react";
import { formatTimeAgo } from "@/lib/format";

// Время считается в браузере после загрузки, чтобы не было расхождений с сервером
export default function TimeAgo({ ts, className = "" }: { ts: number; className?: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const update = () => setText(formatTimeAgo(ts));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [ts]);

  return <span className={className}>{text}</span>;
}
