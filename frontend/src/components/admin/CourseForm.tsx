"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { api, ApiError, type CourseInput } from "@/lib/api";
import { levelLabels } from "@/lib/format";
import type { Category, CourseLevel, ExamSummary } from "@/lib/types";

const empty: CourseInput = { title: "", shortDescription: "", description: "", thumbnailUrl: null, level: "BEGINNER", price: 0, categoryId: null, published: false, featured: false, finalExamId: null, stage: null, minPlacementScore: 0, sequential: true };

export function CourseForm({ initial, submitLabel, onSubmit }: { initial?: Partial<CourseInput>; submitLabel: string; onSubmit: (data: CourseInput) => Promise<void> }) {
  const [form, setForm] = useState<CourseInput>({ ...empty, ...initial });
  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // O'qituvchi: faqat biriktirilgan fanlar; admin: hammasi
    api.admin.mySubjects().then(setCategories).catch(() => api.admin.categories().then(setCategories).catch(() => undefined));
    api.admin.exams().then(setExams).catch(() => undefined);
  }, []);

  const set = <K extends keyof CourseInput>(key: K, value: CourseInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await onSubmit({ ...form, thumbnailUrl: form.thumbnailUrl || null });
      setMsg({ type: "success", text: "Saqlandi" });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof ApiError ? err.message : "Xatolik" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      <div><label className="label" htmlFor="title">Kurs (bosqich) nomi</label><input id="title" className="input" required minLength={3} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Masalan: Matematika: 1-bosqich - Sonlar va tenglamalar" /></div>
      <div><label className="label" htmlFor="short">Qisqa tavsif</label><input id="short" className="input" required minLength={10} maxLength={300} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></div>
      <div><label className="label" htmlFor="desc">To&apos;liq tavsif</label><textarea id="desc" rows={5} className="input" value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="cat">Fan / yo&apos;nalish</label>
          <select id="cat" className="input" value={form.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}>
            <option value="">— Tanlanmagan —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="level">Daraja</label>
          <select id="level" className="input" value={form.level} onChange={(e) => set("level", e.target.value)}>
            {(Object.keys(levelLabels) as CourseLevel[]).map((l) => <option key={l} value={l}>{levelLabels[l]}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="price">Narx (so&apos;m, 0 = bepul)</label><input id="price" type="number" min={0} className="input" value={form.price} onChange={(e) => set("price", Number(e.target.value))} /></div>
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
        <p className="text-sm font-semibold">Onlayn maktab: bosqich sozlamalari</p>
        <p className="mt-1 text-xs text-slate-600">Fan bosqichlarga bo&apos;linadi (1, 2, 3...). Talaba daraja testidan olgan foiziga ko&apos;ra mos bosqichdan boshlaydi; keyingi bosqich oldingisi tugagach ochiladi.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="stage">Bosqich raqami</label>
            <input id="stage" type="number" min={0} max={20} className="input" value={form.stage ?? ""} placeholder="bo'sh = oddiy kurs" onChange={(e) => set("stage", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="mps">Daraja testidan minimal foiz</label>
            <input id="mps" type="number" min={0} max={100} className="input" value={form.minPlacementScore ?? 0} onChange={(e) => set("minPlacementScore", Number(e.target.value))} />
            <p className="mt-1 text-[11px] text-slate-500">1-bosqich: 0; 2-bosqich: masalan 40; 3-bosqich: 75</p>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={!!form.sequential} onChange={(e) => set("sequential", e.target.checked)} />Darslar ketma-ket ochiladi (test o&apos;tilgach)</label>
        </div>
      </div>

      <div><label className="label" htmlFor="thumb">Rasm havolasi (ixtiyoriy)</label><input id="thumb" type="url" className="input" placeholder="https://..." value={form.thumbnailUrl ?? ""} onChange={(e) => set("thumbnailUrl", e.target.value)} /></div>
      <div>
        <label className="label" htmlFor="final">Yakuniy imtihon (bosqich/kurs oxirida)</label>
        <select id="final" className="input" value={form.finalExamId ?? ""} onChange={(e) => set("finalExamId", e.target.value ? Number(e.target.value) : null)}>
          <option value="">— Yo&apos;q —</option>
          {exams.map((x) => <option key={x.id} value={x.id}>{x.title}{x.published ? "" : " (nashr etilmagan)"}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.published} onChange={(e) => set("published", e.target.checked)} />Nashr etilgan (talabalarga ko&apos;rinadi)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />Mashhur kurslar qatorida</label>
      </div>
      <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : submitLabel}</button>
    </form>
  );
}
