"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError, type ExamInput, type ExamQuestionInput, type SectionInput } from "@/lib/api";
import { levelLabels, questionTypeLabels } from "@/lib/format";
import type { BandRow, Category, CourseLevel, ExamAdminDetail, QuestionType, SectionAdminView } from "@/lib/types";

const emptyExam: ExamInput = { code: "", title: "", description: "", level: "INTERMEDIATE", featured: false, published: false, categoryId: null };

export default function ExamEditorPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const examId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const [exam, setExam] = useState<ExamAdminDetail | null>(null);
  const [form, setForm] = useState<ExamInput>(emptyExam);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    if (isNew) return;
    api.admin.exam(examId).then((e) => {
      setExam(e);
      setForm({ code: e.code, title: e.title, description: e.description ?? "", level: e.level, featured: e.featured, published: e.published, categoryId: e.category?.id ?? null });
    }).catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [examId, isNew]);

  useEffect(() => {
    api.admin.categories().then(setCategories).catch(() => undefined);
    load();
  }, [load]);

  if (!isNew && !exam) return error ? <Alert>{error}</Alert> : <PageLoader />;

  const saveBasics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMsg("");
    try {
      if (isNew) {
        const created = await api.admin.createExam(form);
        router.replace(`/admin/exams/${created.id}`);
      } else {
        setExam(await api.admin.updateExam(examId, form));
        setMsg("Saqlandi");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/exams" className="text-sm text-slate-500 hover:underline">← Imtihonlar</Link>
          <h1 className="mt-1 text-2xl font-bold">{isNew ? "Yangi mock imtihon" : exam!.title}</h1>
        </div>
        {!isNew && (
          <div className="flex gap-2">
            <Link href={`/exams/${examId}`} className="btn-secondary">Ko&apos;rish</Link>
            {user?.role === "ADMIN" && (confirmDelete ? (
              <>
                <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Bekor</button>
                <button onClick={async () => { await api.admin.deleteExam(examId); router.push("/admin/exams"); }} className="btn-danger">Ha, o&apos;chirish</button>
              </>
            ) : <button onClick={() => setConfirmDelete(true)} className="btn-danger">O&apos;chirish</button>)}
          </div>
        )}
      </div>

      <form onSubmit={saveBasics} className="card space-y-5 p-6">
        <h2 className="font-semibold">Asosiy ma&apos;lumotlar</h2>
        {error && <Alert>{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <div><label className="label">Kod</label><input className="input font-mono uppercase" required maxLength={40} placeholder="IELTS_READING_2" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="label">Nomi</label><input className="input" required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        </div>
        <div><label className="label">Tavsif</label><textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Yo&apos;nalish</label>
            <select className="input" value={form.categoryId ?? ""} onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">— Tanlanmagan —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Daraja</label>
            <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {(Object.keys(levelLabels) as CourseLevel[]).map((l) => <option key={l} value={l}>{levelLabels[l]}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />Nashr etilgan</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />Bosh sahifada tavsiya</label>
        </div>
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : isNew ? "Imtihonni yaratish" : "Saqlash"}</button>
      </form>

      {!isNew && exam && (
        <>
          <section>
            <h2 className="mb-4 text-lg font-semibold">Bo&apos;limlar va savollar</h2>
            <div className="space-y-4">
              {exam.sections.map((s) => <SectionEditor key={s.id} section={s} onChange={load} />)}
              <NewSection examId={examId} nextIndex={exam.sections.length + 1} onCreated={load} />
            </div>
          </section>
          <BandsEditor examId={examId} bands={exam.bands} onSaved={setExam} />
        </>
      )}
    </div>
  );
}

function NewSection({ examId, nextIndex, onCreated }: { examId: number; nextIndex: number; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SectionInput>({ title: "", orderIndex: nextIndex, durationMinutes: 30 });
  const [error, setError] = useState("");
  if (!open) return <button onClick={() => { setForm({ title: "", orderIndex: nextIndex, durationMinutes: 30 }); setOpen(true); }} className="btn-secondary w-full border-dashed">+ Bo&apos;lim qo&apos;shish (Listening, Reading, Math...)</button>;
  return (
    <form className="card grid gap-4 p-5 sm:grid-cols-[1fr_120px_140px_auto] sm:items-end"
      onSubmit={async (e) => { e.preventDefault(); setError(""); try { await api.admin.addSection(examId, form); setOpen(false); onCreated(); } catch (err) { setError(err instanceof ApiError ? err.message : "Xatolik"); } }}>
      {error && <Alert className="sm:col-span-4">{error}</Alert>}
      <div><label className="label">Bo&apos;lim nomi</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div><label className="label">Tartib</label><input type="number" min={1} className="input" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })} /></div>
      <div><label className="label">Vaqt (daq)</label><input type="number" min={1} className="input" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></div>
      <div className="flex gap-2"><button className="btn-primary">Qo&apos;shish</button><button type="button" onClick={() => setOpen(false)} className="btn-ghost">Bekor</button></div>
    </form>
  );
}

function SectionEditor({ section, onChange }: { section: SectionAdminView; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{section.orderIndex}</span>
        <div className="flex-1"><p className="font-semibold">{section.title}</p><p className="text-xs text-slate-500">{section.durationMinutes} daq · {section.questions.length} ta savol</p></div>
        {confirmDelete ? (
          <>
            <span className="text-sm text-slate-600">Bo&apos;lim va savollari o&apos;chadi.</span>
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Yo&apos;q</button>
            <button onClick={async () => { await api.admin.deleteSection(section.id); onChange(); }} className="btn-danger">Ha</button>
          </>
        ) : <button onClick={() => setConfirmDelete(true)} className="btn-ghost text-red-600">Bo&apos;limni o&apos;chirish</button>}
      </div>
      <ul className="divide-y divide-slate-100">
        {section.questions.map((q) => (
          <li key={q.id} className="px-5 py-4">
            {editingId === q.id ? (
              <QuestionForm initial={{ orderIndex: q.orderIndex, type: q.type, prompt: q.prompt, passage: q.passage, options: q.options, accepted: q.accepted, points: q.points }}
                onCancel={() => setEditingId(null)} onSave={async (d) => { await api.admin.updateQuestion(q.id, d); setEditingId(null); onChange(); }} />
            ) : (
              <div className="flex flex-wrap items-start gap-3">
                <span className="mt-0.5 text-sm font-semibold text-slate-500">{q.orderIndex}.</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{q.prompt}</p>
                  <p className="mt-1 text-xs text-slate-500">{questionTypeLabels[q.type]} · to&apos;g&apos;ri: <span className="font-mono">{q.accepted.join(", ") || "—"}</span> · {q.points} ball</p>
                </div>
                <button onClick={() => setEditingId(q.id)} className="btn-ghost py-1">Tahrirlash</button>
                <button onClick={async () => { await api.admin.deleteQuestion(q.id); onChange(); }} className="btn-ghost py-1 text-red-600">O&apos;chirish</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="p-4">
        {adding ? (
          <QuestionForm initial={{ orderIndex: section.questions.length + 1, type: "SINGLE_CHOICE", prompt: "", passage: null, options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }], accepted: [], points: 1 }}
            onCancel={() => setAdding(false)} onSave={async (d) => { await api.admin.addQuestion(section.id, d); setAdding(false); onChange(); }} />
        ) : <button onClick={() => setAdding(true)} className="btn-secondary w-full border-dashed">+ Savol qo&apos;shish</button>}
      </div>
    </div>
  );
}

const TF_OPTIONS = [{ key: "TRUE", text: "True" }, { key: "FALSE", text: "False" }, { key: "NG", text: "Not Given" }];

function QuestionForm({ initial, onSave, onCancel }: { initial: ExamQuestionInput; onSave: (d: ExamQuestionInput) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState<ExamQuestionInput>(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const hasOptions = f.type === "SINGLE_CHOICE" || f.type === "MULTI_CHOICE" || f.type === "MATCHING";
  const options = f.options ?? [];

  const setType = (type: QuestionType) => {
    if (type === "TRUE_FALSE_NG") setF({ ...f, type, options: TF_OPTIONS, accepted: [] });
    else if (type === "GAP_FILL" || type === "ESSAY") setF({ ...f, type, options: null, accepted: [] });
    else setF({ ...f, type, options: options.length ? options : [{ key: "A", text: "" }, { key: "B", text: "" }], accepted: [] });
  };
  const toggleAccepted = (key: string, single: boolean) =>
    setF({ ...f, accepted: single ? [key] : f.accepted.includes(key) ? f.accepted.filter((k) => k !== key) : [...f.accepted, key] });

  return (
    <form className="space-y-4 rounded-xl bg-slate-50 p-4" onSubmit={async (e) => { e.preventDefault(); setSaving(true); setError(""); try { await onSave({ ...f, options: hasOptions || f.type === "TRUE_FALSE_NG" ? f.options : null }); } catch (err) { setError(err instanceof ApiError ? err.message : "Xatolik"); setSaving(false); } }}>
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-[90px_1fr_110px]">
        <div><label className="label">Tartib</label><input type="number" min={1} className="input" value={f.orderIndex} onChange={(e) => setF({ ...f, orderIndex: Number(e.target.value) })} /></div>
        <div>
          <label className="label">Savol turi</label>
          <select className="input" value={f.type} onChange={(e) => setType(e.target.value as QuestionType)}>
            {(Object.keys(questionTypeLabels) as QuestionType[]).map((t) => <option key={t} value={t}>{questionTypeLabels[t]}</option>)}
          </select>
        </div>
        <div><label className="label">Ball</label><input type="number" min={0.5} step={0.5} className="input" value={f.points} onChange={(e) => setF({ ...f, points: Number(e.target.value) })} /></div>
      </div>
      <div><label className="label">Matn / parcha (ixtiyoriy, Reading uchun)</label><textarea rows={3} className="input" value={f.passage ?? ""} onChange={(e) => setF({ ...f, passage: e.target.value || null })} /></div>
      <div><label className="label">Savol</label><textarea rows={2} required className="input" value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} /></div>

      {(hasOptions || f.type === "TRUE_FALSE_NG") && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{f.type === "MULTI_CHOICE" || f.type === "MATCHING" ? "To'g'ri javoblarni belgilang (bir nechta)." : "To'g'ri javobni belgilang."}</p>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type={f.type === "MULTI_CHOICE" || f.type === "MATCHING" ? "checkbox" : "radio"} name="acc" className="accent-emerald-600" checked={f.accepted.includes(o.key)} onChange={() => toggleAccepted(o.key, !(f.type === "MULTI_CHOICE" || f.type === "MATCHING"))} />
              <input className="input w-16 font-mono" value={o.key} disabled={f.type === "TRUE_FALSE_NG"} onChange={(e) => setF({ ...f, options: options.map((x, j) => (j === i ? { ...x, key: e.target.value.toUpperCase() } : x)) })} />
              <input className="input flex-1" required placeholder="Variant matni" value={o.text} disabled={f.type === "TRUE_FALSE_NG"} onChange={(e) => setF({ ...f, options: options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
              {hasOptions && options.length > 2 && <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => setF({ ...f, options: options.filter((_, j) => j !== i), accepted: f.accepted.filter((k) => k !== o.key) })}>✕</button>}
            </div>
          ))}
          {hasOptions && options.length < 8 && <button type="button" className="btn-ghost text-sm" onClick={() => setF({ ...f, options: [...options, { key: String.fromCharCode(65 + options.length), text: "" }] })}>+ Variant</button>}
        </div>
      )}
      {f.type === "GAP_FILL" && (
        <div>
          <label className="label">Qabul qilinadigan javoblar (vergul bilan, katta-kichik harf farqsiz)</label>
          <input className="input" required placeholder="colour, color" value={f.accepted.join(", ")} onChange={(e) => setF({ ...f, accepted: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
        </div>
      )}
      {f.type === "ESSAY" && <p className="text-xs text-slate-500">Esse avtomatik baholanmaydi; natijada &quot;tekshirilmoqda&quot; deb ko&apos;rsatiladi.</p>}
      <div className="flex gap-2">
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Bekor qilish</button>
      </div>
    </form>
  );
}

function BandsEditor({ examId, bands, onSaved }: { examId: number; bands: BandRow[]; onSaved: (e: ExamAdminDetail) => void }) {
  const [rows, setRows] = useState<BandRow[]>(bands.length ? bands : [{ minRaw: 0, maxRaw: 0, scaled: 0 }]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const set = (i: number, patch: Partial<BandRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold">Ball konversiyasi (xom ball → band / shkala)</h2>
      <p className="mb-4 text-sm text-slate-500">Masalan IELTS: 30–32 to&apos;g&apos;ri javob → 7.0. SAT: 4/4 → 800.</p>
      <div className="card p-5">
        {error && <Alert className="mb-3">{error}</Alert>}
        {msg && <Alert type="success" className="mb-3">{msg}</Alert>}
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-semibold text-slate-500 uppercase"><span>Min xom</span><span>Max xom</span><span>Band / ball</span><span /></div>
        {rows.map((r, i) => (
          <div key={i} className="mt-2 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
            <input type="number" className="input" value={r.minRaw} onChange={(e) => set(i, { minRaw: Number(e.target.value) })} />
            <input type="number" className="input" value={r.maxRaw} onChange={(e) => set(i, { maxRaw: Number(e.target.value) })} />
            <input type="number" step="0.5" className="input" value={r.scaled} onChange={(e) => set(i, { scaled: Number(e.target.value) })} />
            <button type="button" className="btn-ghost text-red-600" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => setRows([...rows, { minRaw: (rows.at(-1)?.maxRaw ?? -1) + 1, maxRaw: (rows.at(-1)?.maxRaw ?? -1) + 1, scaled: 0 }])}>+ Qator</button>
          <button type="button" className="btn-primary" onClick={async () => { setError(""); setMsg(""); try { onSaved(await api.admin.setBands(examId, rows)); setMsg("Saqlandi"); } catch (err) { setError(err instanceof ApiError ? err.message : "Xatolik"); } }}>Konversiyani saqlash</button>
        </div>
      </div>
    </section>
  );
}
