"use client";

import { useRef, useState } from "react";

import { ApiError, uploadMedia, type MediaKind } from "@/lib/api";

const accept: Record<MediaKind, string> = {
  VIDEO: "video/mp4,video/webm,video/quicktime",
  AUDIO: "audio/mpeg,audio/mp4,audio/ogg,audio/wav",
  IMAGE: "image/jpeg,image/png,image/webp",
};
const hint: Record<MediaKind, string> = {
  VIDEO: "MP4 (H.264) tavsiya etiladi, 2 GB gacha",
  AUDIO: "MP3, 200 MB gacha",
  IMAGE: "JPG, PNG yoki WebP, 10 MB gacha",
};

/** Fayl yuklash tugmasi: tanlangan fayl serverga yuboriladi va saqlash kaliti qaytadi. */
export function MediaUpload({ kind, value, onChange, label }: { kind: MediaKind; value: string | null; onChange: (key: string | null) => void; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setPct(0);
    setName(file.name);
    try {
      const res = await uploadMedia(file, kind, setPct);
      onChange(res.key);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Yuklashda xatolik");
    } finally {
      setPct(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
        <input ref={input} type="file" accept={accept[kind]} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" onClick={() => input.current?.click()} disabled={pct !== null} className="btn-secondary">
          {pct !== null ? `Yuklanmoqda… ${pct}%` : value ? "Boshqa fayl yuklash" : "Fayl tanlash"}
        </button>
        <div className="min-w-0 flex-1 text-xs text-slate-500">
          {value ? (
            <span className="flex items-center gap-2">
              <span className="badge bg-emerald-50 text-emerald-700">Platformada saqlangan</span>
              <span className="truncate font-mono">{name || value}</span>
            </span>
          ) : hint[kind]}
        </div>
        {value && pct === null && (
          <button type="button" onClick={() => onChange(null)} className="btn-ghost py-1 text-red-600">Olib tashlash</button>
        )}
      </div>
      {pct !== null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} /></div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
