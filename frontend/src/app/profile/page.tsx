"use client";

import Link from "next/link";
import { useState } from "react";

import { isStaff, useAuth } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Alert } from "@/components/ui/Alert";
import { api, ApiError } from "@/lib/api";
import { roleLabels } from "@/lib/format";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

type Msg = { type: "success" | "error"; text: string } | null;

function ProfileContent() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: user?.fullName ?? "", headline: user?.headline ?? "", bio: user?.bio ?? "", avatarUrl: user?.avatarUrl ?? "" });
  const [msg, setMsg] = useState<Msg>(null);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState<Msg>(null);
  if (!user) return null;
  const staff = isStaff(user);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUser(await api.me.update(form));
      setMsg({ type: "success", text: "Ma'lumotlar saqlandi" });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof ApiError ? err.message : "Xatolik" });
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.me.changePassword(pw);
      setPw({ currentPassword: "", newPassword: "" });
      setPwMsg({ type: "success", text: "Parol yangilandi. Boshqa qurilmalardagi sessiyalar yopildi." });
    } catch (err) {
      setPwMsg({ type: "error", text: err instanceof ApiError ? err.message : "Xatolik" });
    }
  };

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-3xl font-bold">Profil sozlamalari</h1>
      <form onSubmit={save} className="card mt-8 space-y-5 p-6">
        <h2 className="font-semibold">Shaxsiy ma&apos;lumotlar</h2>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
        <div>
          <label className="label" htmlFor="name">Ism va familiya</label>
          <input id="name" className="input" value={form.fullName} minLength={2} required onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <p className="mt-1 text-xs text-slate-500">Sertifikatlarda aynan shu ism ko&apos;rsatiladi.</p>
        </div>
        <div><label className="label">Email</label><input className="input bg-slate-50" value={user.email} disabled /></div>
        <div><label className="label">Rol</label><input className="input bg-slate-50" value={roleLabels[user.role]} disabled /></div>
        {staff && (
          <>
            <div className="border-t border-slate-100 pt-5">
              <p className="text-sm font-semibold">O&apos;qituvchi profili</p>
              <p className="text-xs text-slate-500">Bu ma&apos;lumotlar <Link href={`/teachers/${user.id}`} className="text-brand-700 underline">ochiq sahifangizda</Link> ko&apos;rinadi.</p>
            </div>
            <div>
              <label className="label" htmlFor="headline">Qisqa sarlavha</label>
              <input id="headline" className="input" maxLength={160} placeholder="Masalan: IELTS 8.5, 6 yillik tajriba" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="bio">O&apos;zingiz haqingizda</label>
              <textarea id="bio" rows={5} className="input" maxLength={4000} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="avatar">Rasm havolasi</label>
              <input id="avatar" type="url" className="input" placeholder="https://..." value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
            </div>
          </>
        )}
        <button className="btn-primary">Saqlash</button>
      </form>

      <form onSubmit={savePassword} className="card mt-6 space-y-5 p-6">
        <h2 className="font-semibold">Parolni o&apos;zgartirish</h2>
        {pwMsg && <Alert type={pwMsg.type}>{pwMsg.text}</Alert>}
        <div>
          <label className="label" htmlFor="cur">Joriy parol</label>
          <input id="cur" type="password" className="input" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="new">Yangi parol</label>
          <input id="new" type="password" className="input" required minLength={10} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          <p className="mt-1 text-xs text-slate-500">Kamida 10 ta belgi, harf va raqam.</p>
        </div>
        <button className="btn-primary">Parolni yangilash</button>
      </form>
    </div>
  );
}
