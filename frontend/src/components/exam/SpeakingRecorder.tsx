"use client";

import { useEffect, useRef, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatSeconds } from "@/lib/format";

type Phase = "idle" | "asking" | "prep" | "recording" | "uploading" | "done";

/**
 * Speaking javobi: tayyorlanish vaqti -> yozish (maksimal answerSeconds) -> serverga yuklash.
 * Haqiqiy imtihondagidek bir marta yoziladi; qayta yozish faqat yuklash xato bo'lsa.
 */
export function SpeakingRecorder({ attemptId, questionId, prepSeconds, answerSeconds, existingUrl, disabled, onSaved, readAloud, autoStart }:
  { attemptId: number | string; questionId: number; prepSeconds: number; answerSeconds: number; existingUrl?: string | null; disabled?: boolean;
    onSaved: (url: string) => void; /** Imtihonchi ovozi bilan o'qiladigan savol matni */ readAloud?: string; /** Savol ochilishi bilan avtomatik boshlash */ autoStart?: boolean }) {
  const [phase, setPhase] = useState<Phase>(existingUrl ? "done" : "idle");
  const [left, setLeft] = useState(0);
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string | null>(existingUrl ?? null);
  const [pct, setPct] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); rec.current?.stream.getTracks().forEach((t) => t.stop()); if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const countdown = (seconds: number, onEnd: () => void) => {
    setLeft(seconds);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { clearInterval(timer.current!); onEnd(); return 0; }
        return l - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const r = new MediaRecorder(stream, { mimeType: mime });
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setPhase("uploading");
        try {
          const res = await api.attempts.audioAnswer(attemptId, questionId, blob, setPct);
          setUrl(res.audioUrl);
          setPhase("done");
          onSaved(res.audioUrl);
        } catch (e) {
          setError(e instanceof ApiError ? e.message : "Yuklashda xatolik. Qayta yozib ko'ring.");
          setPhase("idle");
        }
      };
      rec.current = r;
      r.start();
      setPhase("recording");
      countdown(answerSeconds, () => stop());
    } catch {
      setError("Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan mikrofonni yoqing.");
      setPhase("idle");
    }
  };

  const afterQuestion = () => {
    if (prepSeconds > 0) {
      setPhase("prep");
      countdown(prepSeconds, startRecording);
    } else startRecording();
  };

  /** Haqiqiy imtihondagidek: avval imtihonchi savolni o'qiydi (brauzer ovozi), keyin tayyorlanish/javob. */
  const begin = () => {
    setError("");
    const text = readAloud?.replace(/\s+/g, " ").trim();
    if (text && typeof window !== "undefined" && "speechSynthesis" in window) {
      setPhase("asking");
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find((v) => /^en[-_](GB|AU|IE)/i.test(v.lang)) ?? voices.find((v) => /^en/i.test(v.lang));
      if (en) u.voice = en;
      u.lang = en?.lang ?? "en-GB";
      u.rate = 0.95;
      let done = false;
      const finish = () => { if (done) return; done = true; afterQuestion(); };
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      setTimeout(finish, Math.min(60000, 2000 + text.length * 90)); // ovoz ishlamasa ham davom etadi
    } else afterQuestion();
  };

  const started = useRef(false);
  useEffect(() => {
    if (autoStart && !disabled && phase === "idle" && !started.current) { started.current = true; begin(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, disabled]);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      {phase === "idle" && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={begin} disabled={disabled} className="btn-primary">🎙 Javobni boshlash</button>
          <p className="text-xs text-slate-500">
            {prepSeconds > 0 ? `${formatSeconds(prepSeconds)} tayyorlanish, ` : ""}{formatSeconds(answerSeconds)} gacha javob. Yozish avtomatik boshlanadi va tugaydi.
          </p>
        </div>
      )}
      {phase === "asking" && (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-lg">🗣</span>
          <p className="text-sm">Imtihonchi savolni o&apos;qimoqda… tinglang.</p>
          <button type="button" onClick={() => { window.speechSynthesis?.cancel(); afterQuestion(); }} className="btn-ghost btn-sm">O&apos;tkazib yuborish</button>
        </div>
      )}
      {phase === "prep" && (
        <div className="flex items-center gap-4">
          <span className="rounded-lg bg-amber-100 px-3 py-1 font-mono text-lg text-amber-800">{formatSeconds(left)}</span>
          <p className="text-sm">Tayyorlaning. Vaqt tugashi bilan yozish boshlanadi.</p>
          <button type="button" onClick={() => { if (timer.current) clearInterval(timer.current); startRecording(); }} className="btn-secondary">Hozir boshlash</button>
        </div>
      )}
      {phase === "recording" && (
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1 font-mono text-lg text-red-700"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />{formatSeconds(left)}</span>
          <p className="text-sm">Yozilmoqda... gapiring.</p>
          <button type="button" onClick={stop} className="btn-danger">To&apos;xtatish va yuborish</button>
        </div>
      )}
      {phase === "uploading" && <p className="text-sm text-slate-600">Yuklanmoqda… {pct}%</p>}
      {phase === "done" && url && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700">✓ Javob yozildi va saqlandi</p>
          <audio src={url} controls className="w-full" />
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
