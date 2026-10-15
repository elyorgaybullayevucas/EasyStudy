"use client";

import { useCallback, useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { Alert } from "@/components/ui/Alert";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/ui/Icons";
import { api, ApiError } from "@/lib/api";
import { groupLabels, groupOrder } from "@/lib/format";
import type { Category, CategoryGroup } from "@/lib/types";

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

  const load = useCallback(() => {
    api.admin.categories().then(setItems).catch(() => undefined);
  }, []);
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
          <li key={c.id} className="flex items-center gap-4 px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><CategoryIcon icon={c.icon} /></span>
            <div className="flex-1">
              <p className="font-medium">{c.name} <span className="badge ml-1 bg-slate-100 text-slate-600">{groupLabels[c.group].title}</span></p>
              <p className="text-xs text-slate-500">{c.courseCount} ta kurs · {c.examCount} ta imtihon · /{c.slug}</p>
            </div>
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
