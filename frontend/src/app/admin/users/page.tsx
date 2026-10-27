"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Alert } from "@/components/ui/Alert";
import { api, ApiError } from "@/lib/api";
import { formatDate, roleLabels } from "@/lib/format";
import type { Category, User, UserRole } from "@/lib/types";

export default function UsersPage() {
  return (
    <RequireAuth roles={["ADMIN"]}>
      <UsersContent />
    </RequireAuth>
  );
}

function UsersContent() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const load = useCallback(() => {
    api.admin.users({ search }).then((p) => { setUsers(p.items); setTotal(p.total); }).catch((e) => setError(e instanceof ApiError ? e.message : "Xatolik"));
    api.admin.categories().then(setCategories).catch(() => undefined);
  }, [search]);
  const subjectsOf = (userId: number) => categories.filter((c) => c.teachers.some((t) => t.id === userId));
  const [editingSubjects, setEditingSubjects] = useState<number | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const saveSubjects = async (u: User) => {
    setError("");
    try {
      await api.admin.setUserSubjects(u.id, picked);
      setMsg(`${u.fullName} uchun fanlar saqlandi: ${picked.length ? categories.filter((c) => picked.includes(c.id)).map((c) => c.name).join(", ") : "yo'q"}.`);
      setEditingSubjects(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Xatolik");
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const changeRole = async (id: number, role: UserRole) => {
    setError("");
    setMsg("");
    try {
      const u = await api.admin.setRole(id, role);
      setMsg(`${u.fullName} roli "${roleLabels[u.role]}" qilib saqlandi. Foydalanuvchi sahifani yangilasa (yoki qayta kirsa) yangi rol kuchga kiradi.${role === "TEACHER" ? " Endi \"Kategoriyalar -> Sozlash\" da uni fanga biriktiring." : ""}`);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Foydalanuvchilar ({total})</h1>
        <input className="input w-64" placeholder="Ism yoki email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <p className="text-sm text-slate-600">Rolni o&apos;zgartirish darhol saqlanadi. <b>O&apos;qituvchi</b> roli berilgach, <Link href="/admin/categories" className="text-brand-700 underline">Kategoriyalar → Sozlash</Link> da uni fanga biriktiring — shunda u o&apos;sha fanning barcha materiallarini boshqaradi va natijalarni kuzatadi. Ochiq profili <code>/teachers/ID</code> manzilida.</p>
      {error && <Alert>{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
            <tr><th className="px-4 py-3">Foydalanuvchi</th><th className="px-4 py-3">Ro&apos;yxatdan o&apos;tgan</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Biriktirilgan fanlar</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3"><p className="font-medium">{u.fullName}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                <td className="px-4 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <select className="input w-40 py-1.5" value={u.role} disabled={u.id === me?.id} onChange={(e) => changeRole(u.id, e.target.value as UserRole)}>
                    {(Object.keys(roleLabels) as UserRole[]).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {u.role === "STUDENT" ? "—" : editingSubjects === u.id ? (
                    <div className="space-y-2">
                      <div className="flex max-w-xl flex-wrap gap-2">
                        {categories.map((c) => (
                          <label key={c.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                            <input type="checkbox" className="accent-brand-600" checked={picked.includes(c.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, c.id] : picked.filter((x) => x !== c.id))} />
                            {c.name}
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveSubjects(u)} className="btn-primary py-1 text-xs">Saqlash</button>
                        <button onClick={() => setEditingSubjects(null)} className="btn-ghost py-1 text-xs">Bekor</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {subjectsOf(u.id).length ? <span>{subjectsOf(u.id).map((c) => c.name).join(", ")}</span> : <span className="text-amber-700">fan biriktirilmagan</span>}
                      <button onClick={() => { setEditingSubjects(u.id); setPicked(subjectsOf(u.id).map((c) => c.id)); }} className="btn-ghost py-1 text-xs">Fanlarni tanlash</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
