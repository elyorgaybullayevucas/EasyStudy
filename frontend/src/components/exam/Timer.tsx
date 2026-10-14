"use client";

import { useEffect, useState } from "react";

/** Faqat ko'rsatish uchun; haqiqiy muddat serverda (attempt.expiresAt). */
export function Timer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setLeft(l);
      if (l === 0) {
        clearInterval(t);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt, onExpire]);

  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const warn = left < 5 * 60000;
  return (
    <div className={`rounded-lg px-3 py-1 font-mono text-lg ${warn ? "bg-red-500/20 text-red-200" : "bg-white/10"}`}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}
