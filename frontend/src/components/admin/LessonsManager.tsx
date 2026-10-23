"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { api, ApiError, type LessonInput } from "@/lib/api";
import type { ExamSummary, Lesson, ModuleBrief } from "@/lib/types";

import { MediaUpload } from "./MediaUpload";

const emptyLesson: LessonInput = { title: "", content: "", videoUrl: "", videoKey: null, durationMinutes: 10, preview: false, examId: null, moduleId: null };

export function LessonsManager({ courseId, lessons, modules = [], onChange }: { courseId: number; lessons: Lesson[]; modules?: ModuleBrief[]; onChange: () => void }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {lessons.length > 0 && (
        <ol className="card divide-y divide-slate-100">
          {lessons.map((l, i) => (
            <li key={l.id} className="px-5 py-4">
              {editing === l.id ? (
                <LessonEditor modules={modules} initial={{ ...l, videoUrl: l.videoSource === "EXTERNAL" ? (l.videoUrl ?? "") : "", videoKey: l.videoKey, examId: l.exam?.id ?? null, moduleId: l.moduleId }} onCancel={() => setEditing(null)}
                  onSave={async (data) => { await api.admin.updateLesson(l.id, data); setEditing(null); onChange(); }} />
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {l.durationMinutes} daq {l.preview && "• bepul"} •{" "}
                      {l.videoSource === "PLATFORM" ? <span className="text-emerald-700">platforma videosi</span> : l.videoSource === "EXTERNAL" ? "tashqi video" : "video yo'q"}
                      {l.exam && <> · mock: <span className="text-brand-700">{l.exam.title}</span></>}
                      {l.moduleId ? <> · bo&apos;lim: {modules.find((m) => m.id === l.moduleId)?.title ?? "?"}</> : modules.length > 0 ? <span className="text-amber-700"> · bo&apos;limsiz</span> : null}
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
          <LessonEditor modules={modules} initial={{ ...emptyLesson, moduleId: modules[modules.length - 1]?.id ?? null }} onCancel={() => setEditing(null)}
            onSave={async (data) => { await api.admin.createLesson(courseId, data); setEditing(null); onChange(); }} />
        </div>
      ) : (
        <button onClick={() => setEditing("new")} className="btn-secondary w-full border-dashed">+ Dars qo&apos;shish</button>
      )}
    </div>
  );
}

function LessonEditor({ initial, modules, onSave, onCancel }: { initial: LessonInput & { position?: number | null }; modules: ModuleBrief[]; onSave: (data: LessonInput) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<LessonInput>({ title: initial.title, content: initial.content, videoUrl: initial.videoUrl, videoKey: initial.videoKey, durationMinutes: initial.durationMinutes, preview: initial.preview, position: initial.position, examId: initial.examId ?? null, moduleId: initial.moduleId ?? null });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  useEffect(() => { api.admin.exams().then(setExams).catch(() => undefined); }, []);

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
      {modules.length > 0 && (
        <div>
          <label className="label">Bo&apos;lim</label>
          <select className="input" value={form.moduleId ?? ""} onChange={(e) => setForm({ ...form, moduleId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">— Bo&apos;limsiz —</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.position}. {m.title}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label">Dars matni / konspekt</label>
        <textarea rows={8} className="input font-mono text-sm" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <p className="mt-1 text-xs text-slate-500">Formulalar: satr ichida <code>{"$x^2 + 1$"}</code>, alohida qatorda <code>{"$$\\frac{a}{b}$$"}</code> (LaTeX). Belgilash: <code>## Sarlavha</code>, <code>**qalin**</code>, <code>- ro&apos;yxat</code>.</p>
      </div>
      <div>
        <label className="label">Mavzu mock&apos;i (darsdan keyin tavsiya etiladigan bo&apos;lim mashqi, ixtiyoriy)</label>
        <select className="input" value={form.examId ?? ""} onChange={(e) => setForm({ ...form, examId: e.target.value ? Number(e.target.value) : null })}>
          <option value="">— Yo&apos;q —</option>
          {exams.map((x) => <option key={x.id} value={x.id}>{x.title}{x.published ? "" : " (nashr etilmagan)"}</option>)}
        </select>
        <p className="mt-1 text-xs text-slate-500">Mock imtihonlar bo&apos;limida &quot;Bo&apos;limli mashqlar&quot; shablonidan yarating (masalan IELTS Listening mashqi), so&apos;ng shu yerda tanlang.</p>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.preview} onChange={(e) => setForm({ ...form, preview: e.target.checked })} />Bepul tanishuv darsi (ro&apos;yxatdan o&apos;tmaganlarga ham ochiq)</label>
      <div className="flex gap-2">
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Bekor qilish</button>
      </div>
    </form>
  );
}
