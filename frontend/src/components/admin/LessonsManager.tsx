"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { api, ApiError, type LessonInput } from "@/lib/api";
import type { Lesson } from "@/lib/types";

import { MediaUpload } from "./MediaUpload";

const emptyLesson: LessonInput = { title: "", content: "", videoUrl: "", videoKey: null, durationMinutes: 10, preview: false };

export function LessonsManager({ courseId, lessons, onChange }: { courseId: number; lessons: Lesson[]; onChange: () => void }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {lessons.length > 0 && (
        <ol className="card divide-y divide-slate-100">
          {lessons.map((l, i) => (
            <li key={l.id} className="px-5 py-4">
              {editing === l.id ? (
                <LessonEditor initial={{ ...l, videoUrl: l.videoSource === "EXTERNAL" ? (l.videoUrl ?? "") : "", videoKey: l.videoKey }} onCancel={() => setEditing(null)}
                  onSave={async (data) => { await api.admin.updateLesson(l.id, data); setEditing(null); onChange(); }} />
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {l.durationMinutes} daq {l.preview && "• bepul"} •{" "}
                      {l.videoSource === "PLATFORM" ? <span className="text-emerald-700">platforma videosi</span> : l.videoSource === "EXTERNAL" ? "tashqi video" : "video yo'q"}
                    </p>
                  </div>
                  {confirmDelete === l.id ? (
                    <>
                      <span className="text-sm text-slate-600">O&apos;chirasizmi?</span>
                      <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Yo&apos;q</button>
                      <button onClick={async () => { await api.admin.deleteLesson(l.id); setConfirmDelete(null); onChange(); }} className="btn-danger">Ha, o&apos;chirish</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing(l.id)} className="btn-ghost">Tahrirlash</button>
                      <button onClick={() => setConfirmDelete(l.id)} className="btn-ghost text-red-600">O&apos;chirish</button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {editing === "new" ? (
        <div className="card p-5">
          <LessonEditor initial={emptyLesson} onCancel={() => setEditing(null)}
            onSave={async (data) => { await api.admin.createLesson(courseId, data); setEditing(null); onChange(); }} />
        </div>
      ) : (
        <button onClick={() => setEditing("new")} className="btn-secondary w-full border-dashed">+ Dars qo&apos;shish</button>
      )}
    </div>
  );
}

function LessonEditor({ initial, onSave, onCancel }: { initial: LessonInput & { position?: number | null }; onSave: (data: LessonInput) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<LessonInput>({ title: initial.title, content: initial.content, videoUrl: initial.videoUrl, videoKey: initial.videoKey, durationMinutes: initial.durationMinutes, preview: initial.preview, position: initial.position });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, videoUrl: form.videoUrl || null });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-[1fr_140px_100px]">
        <div><label className="label">Dars nomi</label><input className="input" required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label className="label">Davomiyligi (daq)</label><input type="number" min={0} className="input" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></div>
        <div><label className="label">Tartib</label><input type="number" min={0} className="input" value={form.position ?? ""} placeholder="auto" onChange={(e) => setForm({ ...form, position: e.target.value === "" ? null : Number(e.target.value) })} /></div>
      </div>
      <MediaUpload kind="VIDEO" label="Video (platformada saqlanadi, talabalar faqat shu yerda ko'radi)" value={form.videoKey} onChange={(key) => setForm({ ...form, videoKey: key })} />
      {!form.videoKey && (
        <div>
          <label className="label">Yoki tashqi havola (Vimeo / mp4), ixtiyoriy</label>
          <input type="url" className="input" placeholder="https://..." value={form.videoUrl ?? ""} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        </div>
      )}
      <div><label className="label">Dars matni / konspekt</label><textarea rows={5} className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.preview} onChange={(e) => setForm({ ...form, preview: e.target.checked })} />Bepul tanishuv darsi (ro&apos;yxatdan o&apos;tmaganlarga ham ochiq)</label>
      <div className="flex gap-2">
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Bekor qilish</button>
      </div>
    </form>
  );
}
