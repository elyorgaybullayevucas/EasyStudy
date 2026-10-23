"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { api, ApiError, type ModuleInput } from "@/lib/api";
import type { ExamSummary, Lesson, ModuleBrief } from "@/lib/types";

/** Bo'limlar (modullar): nomi, tartibi, bo'lim mock'i. Darslar bo'limga dars tahririda biriktiriladi. */
export function ModulesManager({ courseId, modules, lessons, onChange }: { courseId: number; modules: ModuleBrief[]; lessons: Lesson[]; onChange: () => void }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  useEffect(() => { api.admin.exams().then(setExams).catch(() => undefined); }, []);

  return (
    <div className="space-y-3">
      {modules.length > 0 && (
        <ol className="card divide-y divide-slate-100">
          {modules.map((m) => (
            <li key={m.id} className="px-5 py-4">
              {editing === m.id ? (
                <ModuleEditor initial={{ title: m.title, description: m.description, position: m.position, examId: m.exam?.id ?? null }} exams={exams} onCancel={() => setEditing(null)}
                  onSave={async (d) => { await api.admin.updateModule(m.id, d); setEditing(null); onChange(); }} />
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">{m.position}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      {lessons.filter((l) => l.moduleId === m.id).length} ta dars
                      {m.exam ? <> · bo&apos;lim mock&apos;i: <span className="text-violet-700">{m.exam.title}</span></> : " · mock yo'q"}
                    </p>
                  </div>
                  {confirmDelete === m.id ? (
                    <>
                      <span className="text-sm text-slate-600">Darslar bo&apos;limsiz qoladi. O&apos;chirasizmi?</span>
                      <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Yo&apos;q</button>
                      <button onClick={async () => { await api.admin.deleteModule(m.id); setConfirmDelete(null); onChange(); }} className="btn-danger">Ha</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing(m.id)} className="btn-ghost">Tahrirlash</button>
                      <button onClick={() => setConfirmDelete(m.id)} className="btn-ghost text-red-600">O&apos;chirish</button>
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
          <ModuleEditor initial={{ title: "", description: "", position: null, examId: null }} exams={exams} onCancel={() => setEditing(null)}
            onSave={async (d) => { await api.admin.createModule(courseId, d); setEditing(null); onChange(); }} />
        </div>
      ) : (
        <button onClick={() => setEditing("new")} className="btn-secondary w-full border-dashed">+ Bo&apos;lim qo&apos;shish</button>
      )}
    </div>
  );
}

function ModuleEditor({ initial, exams, onSave, onCancel }: { initial: ModuleInput; exams: ExamSummary[]; onSave: (d: ModuleInput) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<ModuleInput>(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try { await onSave(form); } catch (err) { setError(err instanceof ApiError ? err.message : "Xatolik"); setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <div><label className="label">Bo&apos;lim nomi</label><input className="input" required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Masalan: Sonlar va amallar" /></div>
        <div><label className="label">Tartib</label><input type="number" min={1} className="input" value={form.position ?? ""} placeholder="auto" onChange={(e) => setForm({ ...form, position: e.target.value === "" ? null : Number(e.target.value) })} /></div>
      </div>
      <div><label className="label">Qisqa tavsif</label><input className="input" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div>
        <label className="label">Bo&apos;lim mock&apos;i (bo&apos;lim oxirida; &quot;Bo&apos;limli mashqlar&quot; shablonidan yarating)</label>
        <select className="input" value={form.examId ?? ""} onChange={(e) => setForm({ ...form, examId: e.target.value ? Number(e.target.value) : null })}>
          <option value="">— Yo&apos;q —</option>
          {exams.map((x) => <option key={x.id} value={x.id}>{x.title}{x.published ? "" : " (nashr etilmagan)"}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Bekor qilish</button>
      </div>
    </form>
  );
}
