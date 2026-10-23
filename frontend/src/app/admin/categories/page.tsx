"use client";

import { useCallback, useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { Alert } from "@/components/ui/Alert";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/ui/Icons";
import { api, ApiError } from "@/lib/api";
import { groupLabels, groupOrder } from "@/lib/format";
import type { Category, CategoryGroup, ExamSummary, User } from "@/lib/types";

export default function CategoriesPage() {
  return (
    <RequireAuth roles={["ADMIN"]}>
      <CategoriesContent />
    </RequireAuth>
  );
}

function CategoriesContent() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", description: "", icon: "sparkles", group: "SCHOOL" as CategoryGroup, position: 50 });
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [edit, setEdit] = useState({ description: "", placementExamId: null as number | null, certSlugs: "", teacherIds: [] as number[] });

  const load = useCallback(() => {
    api.admin.categories().then(setItems).catch(() => undefined);
    api.admin.teachers().then(setTeachers).catch(() => undefined);
    api.admin.exams().then(setExams).catch(() => undefined);
  }, []);

  const startEdit = (c: Category) => {
    setEditing(c.id);
    setEdit({ description: c.description ?? "", placementExamId: c.placementExam?.id ?? null, certSlugs: c.certSlugs.join(","), teacherIds: c.teachers.map((t) => t.id) });
  };
  const saveEdit = async (c: Category) => {
    setError("");
    try {
      await api.admin.updateCategory(c.id, { name: c.name, description: edit.description, icon: c.icon ?? undefined, group: c.group, position: c.position, placementExamId: edit.placementExamId, certSlugs: edit.certSlugs });
      await api.admin.setCategoryTeachers(c.id, edit.teacherIds);
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik");
    }
  };
  useEffect(load, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.admin.createCategory(form);
      setForm({ name: "", description: "", icon: "sparkles", group: "SCHOOL", position: 50 });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yo&apos;nalishlar (kategoriyalar)</h1>
      <form onSubmit={create} className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_160px_120px_auto] sm:items-end">
        {error && <Alert className="sm:col-span-5">{error}</Alert>}
        <div><label className="label">Nomi</label><input className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">Tavsif</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div>
          <label className="label">Guruh</label>
          <select className="input" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value as CategoryGroup })}>
            {groupOrder.map((g) => <option key={g} value={g}>{groupLabels[g].title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ikona</label>
          <select className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>{CATEGORY_ICONS.map((i) => <option key={i}>{i}</option>)}</select>
        </div>
        <button className="btn-primary">Qo&apos;shish</button>
      </form>
      <ul className="card divide-y divide-slate-100">
        {items.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><CategoryIcon icon={c.icon} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{c.name} <span className="badge ml-1 bg-slate-100 text-slate-600">{groupLabels[c.group].title}</span></p>
              <p className="text-xs text-slate-500">{c.courseCount} ta kurs · {c.examCount} ta imtihon · /{c.slug}
                {c.teachers.length > 0 && <> · o&apos;qituvchi: <span className="text-brand-700">{c.teachers.map((t) => t.fullName).join(", ")}</span></>}
                {c.placementExam && <> · daraja testi: {c.placementExam.title}</>}
              </p>
            </div>
            {editing === c.id ? (
              <div className="w-full space-y-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <div><label className="label">Tavsif</label><input className="input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Daraja aniqlash testi (onlayn maktab)</label>
                    <select className="input" value={edit.placementExamId ?? ""} onChange={(e) => setEdit({ ...edit, placementExamId: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">— Yo&apos;q —</option>
                      {exams.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Tayyorlaydigan sertifikatlar (kategoriya sluglari, vergul bilan)</label>
                    <input className="input" placeholder="dtm,milliy-sertifikat" value={edit.certSlugs} onChange={(e) => setEdit({ ...edit, certSlugs: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">Mas&apos;ul o&apos;qituvchilar (fan materiallarini boshqaradi, natijalarni nazorat qiladi)</label>
                  {teachers.length === 0 ? <p className="text-xs text-slate-500">O&apos;qituvchi yo&apos;q: Foydalanuvchilar bo&apos;limida kerakli foydalanuvchi rolini TEACHER qiling.</p> : (
                    <div className="flex flex-wrap gap-3">
                      {teachers.map((t) => (
                        <label key={t.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
                          <input type="checkbox" className="accent-brand-600" checked={edit.teacherIds.includes(t.id)} onChange={(e) => setEdit({ ...edit, teacherIds: e.target.checked ? [...edit.teacherIds, t.id] : edit.teacherIds.filter((x) => x !== t.id) })} />
                          {t.fullName} <span className="text-xs text-slate-400">{t.email}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(c)} className="btn-primary">Saqlash</button>
                  <button onClick={() => setEditing(null)} className="btn-ghost">Bekor</button>
                </div>
              </div>
            ) : <button className="btn-ghost" onClick={() => startEdit(c)}>Sozlash</button>}
            {confirmDelete === c.id ? (
              <>
                <span className="text-sm text-slate-600">Kurslar kategoriyasiz qoladi.</span>
                <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Yo&apos;q</button>
                <button onClick={async () => { await api.admin.deleteCategory(c.id); setConfirmDelete(null); load(); }} className="btn-danger">Ha</button>
              </>
            ) : <button className="btn-ghost text-red-600" onClick={() => setConfirmDelete(c.id)}>O&apos;chirish</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
