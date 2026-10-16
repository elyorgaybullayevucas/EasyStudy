"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatSeconds } from "@/lib/format";

/**
 * Haqiqiy computer-delivered IELTS kabi Listening audiosi:
 *  - bo'lim boshlanishi bilan avtomatik ijro etiladi (brauzer ruxsat bermasa bitta "Boshlash" tugmasi);
 *  - to'xtatib, qaytarib yoki oldinga surib bo'lmaydi; faqat ovoz balandligi;
 *  - sahifa yangilansa audio bo'lim boshlangan vaqtga qarab o'z joyidan davom etadi (qayta eshitib bo'lmaydi);
 *  - audio tugagach javoblarni tekshirish uchun 2 daqiqa, so'ng bo'lim avtomatik yakunlanadi.
 */
export function ListeningPlayer({ src, startedAt, checkSeconds = 120, onCheckExpired }:
  { src: string; startedAt: string; checkSeconds?: number; onCheckExpired: () => void }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [pos, setPos] = useState(0);
  const [state, setState] = useState<"loading" | "blocked" | "playing" | "ended">("loading");
  const [checkLeft, setCheckLeft] = useState(checkSeconds);
  const [volume, setVolume] = useState(1);
  const expiredFired = useRef(false);

  const elapsed = useCallback(() => (Date.now() - new Date(startedAt).getTime()) / 1000, [startedAt]);

  // Audio tugagach: tekshirish vaqti (bo'lim boshlanishi + audio + checkSeconds ga bog'langan, yangilashga chidamli)
  useEffect(() => {
    if (state !== "ended" || !duration) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.round(duration + checkSeconds - elapsed()));
      setCheckLeft(left);
      if (left === 0 && !expiredFired.current) { expiredFired.current = true; clearInterval(t); onCheckExpired(); }
    }, 1000);
    return () => clearInterval(t);
  }, [state, duration, checkSeconds, elapsed, onCheckExpired]);

  const tryPlay = useCallback(async () => {
    const a = ref.current;
    if (!a) return;
    try { await a.play(); setState("playing"); } catch { setState("blocked"); }
  }, []);

  const onLoaded = () => {
    const a = ref.current;
    if (!a) return;
    setDuration(a.duration);
    const off = elapsed();
    if (off >= a.duration) { setState("ended"); return; }
    a.currentTime = Math.max(0, off);
    tryPlay();
  };

  return (
    <div className="card sticky top-16 z-20 border-brand-200 p-4" onContextMenu={(e) => e.preventDefault()}>
      <audio ref={ref} src={src} preload="auto" onLoadedMetadata={onLoaded} onTimeUpdate={() => setPos(ref.current?.currentTime ?? 0)}
        onEnded={() => setState("ended")} onPause={() => { const a = ref.current; if (a && !a.ended && state === "playing") a.play().catch(() => undefined); }}
        onSeeking={() => { const a = ref.current; if (a && Math.abs(a.currentTime - elapsed()) > 2 && !a.ended) a.currentTime = Math.min(elapsed(), a.duration); }} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">🎧 Listening audio</span>
        {state === "loading" && <span className="text-xs text-slate-500">yuklanmoqda…</span>}
        {state === "blocked" && <button type="button" onClick={tryPlay} className="btn-primary btn-sm">▶ Audioni boshlash</button>}
        {state === "playing" && <span className="badge bg-red-50 text-red-700"><span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-red-600" />ijro etilmoqda · bir marta</span>}
        {state === "ended" && <span className="badge bg-amber-50 text-amber-800">Audio tugadi · javoblarni tekshirish: {formatSeconds(checkLeft)}</span>}
        <span className="ml-auto font-mono text-xs text-slate-500">{formatSeconds(Math.floor(pos))} / {formatSeconds(Math.floor(duration))}</span>
        <label className="flex items-center gap-1 text-xs text-slate-500">🔊<input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); if (ref.current) ref.current.volume = v; }} className="w-20 accent-brand-600" /></label>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand-600 transition-[width]" style={{ width: duration ? `${Math.min(100, (pos / duration) * 100)}%` : "0%" }} /></div>
      <p className="mt-1 text-[11px] text-slate-500">Haqiqiy imtihondagidek: audio to&apos;xtatilmaydi va qaytarilmaydi. Tinglash davomida javoblarni yozib boring.</p>
    </div>
  );
}
