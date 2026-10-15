"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { MediaUpload } from "@/components/admin/MediaUpload";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError, type ExamInput, type ExamQuestionInput, type SectionInput } from "@/lib/api";
import { cn, groupLabels, levelLabels, partTypeLabels, questionTypeLabels, scoringModeLabels } from "@/lib/format";
import type { BandRow, Category, CourseLevel, ExamAdminDetail, PartType, QuestionType, ScoringMode, SectionAdminView, TemplateInfo } from "@/lib/types";

const emptyExam: ExamInput = { code: "", title: "", description: "", level: "INTERMEDIATE", featured: false, published: false, categoryId: null, scoringMode: "TOTAL", instructions: "" };

export default function ExamEditorPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const examId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const [exam, setExam] = useState<ExamAdminDetail | null>(null);
  const [form, setForm] = useState<ExamInput>(emptyExam);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [template, setTemplate] = useState<string>("IELTS_ACADEMIC");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    if (isNew) return;
    api.admin.exam(examId).then((e) => {
      setExam(e);
      setForm({ code: e.code, title: e.title, description: e.description ?? "", level: e.level, featured: e.featured, published: e.published, categoryId: e.category?.id ?? null, scoringMode: e.scoringMode, instructions: e.instructions ?? "" });
    }).catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [examId, isNew]);

  useEffect(() => {
    api.admin.categories().then(setCategories).catch(() => undefined);
    if (isNew) api.admin.examTemplates().then(setTemplates).catch(() => undefined);
    load();
  }, [load, isNew]);

  if (!isNew && !exam) return error ? <Alert>{error}</Alert> : <PageLoader />;

  const saveBasics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMsg("");
    try {
      if (isNew) {
        const created = template === "CUSTOM" ? await api.admin.createExam(form) : await api.admin.createExamFromTemplate(template, form);
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

  const selectedTemplate = templates.find((t) => t.code === template);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/exams" className="text-sm text-slate-500 hover:underline">← Imtihonlar</Link>
          <h1 className="mt-1 text-2xl font-bold">{isNew ? "Yangi mock imtihon" : exam!.title}</h1>
          {!isNew && exam && <p className="text-xs text-slate-500">Shablon: {exam.templateCode} · {scoringModeLabels[exam.scoringMode]} · egasi: {exam.ownerName ?? "—"}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/admin/guide" className="btn-ghost">Yo&apos;riqnoma</Link>
          {!isNew && <Link href={`/exams/${examId}`} className="btn-secondary">Ko&apos;rish</Link>}
          {!isNew && (confirmDelete ? (
            <>
              <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Bekor</button>
              <button onClick={async () => { await api.admin.deleteExam(examId); router.push("/admin/exams"); }} className="btn-danger">Ha, o&apos;chirish</button>
            </>
          ) : <button onClick={() => setConfirmDelete(true)} className="btn-danger">O&apos;chirish</button>)}
        </div>
      </div>

      {isNew && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">1. Imtihon formatini tanlang</h2>
          <p className="mb-4 text-sm text-slate-500">Shablon bo&apos;limlar, vaqt, ballar, konversiya jadvallari va Writing/Speaking vazifalarini tayyor beradi. Siz faqat materiallarni qo&apos;shasiz.</p>
          {(["INTERNATIONAL", "LOCAL_CERT", "PRACTICE", "OTHER"] as const).map((g) => {
            const items = templates.filter((t) => t.group === g);
            return items.length === 0 ? null : (
              <div key={g} className="mb-5">
                <p className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">{g === "PRACTICE" ? "Bo'limli mashqlar (darsga bog'lash uchun)" : groupLabels[g].title}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((t) => (
                    <button key={t.code} type="button" onClick={() => setTemplate(t.code)}
                      className={cn("card p-4 text-left transition hover:border-brand-300", template === t.code && "border-brand-500 ring-2 ring-brand-500/20")}>
                      <p className="font-semibold">{t.title}</p>
                      <p className="mt-1 line-clamp-3 text-xs text-slate-600">{t.description}</p>
                      <p className="mt-2 text-xs text-slate-500">{t.sections.length ? `${t.sections.length} bo'lim · ${t.totalMinutes} daq` : "bo'sh"}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {selectedTemplate && selectedTemplate.sections.length > 0 && (
            <div className="card p-5">
              <p className="font-semibold">{selectedTemplate.title}: bo&apos;limlar</p>
              <ul className="mt-2 divide-y divide-slate-100 text-sm">
                {selectedTemplate.sections.map((s) => (
                  <li key={s.title} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                    <span className="w-56 font-medium">{s.title}</span>
                    <span className="badge bg-slate-100 text-slate-600">{partTypeLabels[s.partType]}</span>
                    <span className="text-slate-500">{s.durationMinutes} daq · {s.questionCount} {s.manual ? "vazifa (o'qituvchi baholaydi)" : "savol"} · {s.defaultPoints} ball</span>
                    <span className="text-xs text-slate-400">{s.questionTypes}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">{selectedTemplate.scoringNote}</p>
            </div>
          )}
        </section>
      )}

      <form onSubmit={saveBasics} className="card space-y-5 p-6">
        <h2 className="font-semibold">{isNew ? "2. Asosiy ma'lumotlar" : "Asosiy ma'lumotlar"}</h2>
        {error && <Alert>{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
          <div><label className="label">Kod</label><input className="input font-mono uppercase" required maxLength={40} placeholder="IELTS_AC_2025_01" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="label">Nomi</label><input className="input" required maxLength={255} placeholder="IELTS Academic Mock #1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        </div>
        <div><label className="label">Qisqa tavsif (katalogda)</label><textarea rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><label className="label">Talabaga yo&apos;riqnoma (imtihon boshida)</label><textarea rows={3} className="input" value={form.instructions ?? ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label">Yo&apos;nalish</label>
            <select className="input" value={form.categoryId ?? ""} onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">— Tanlanmagan —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Daraja</label>
            <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as CourseLevel })}>
              {(Object.keys(levelLabels) as CourseLevel[]).map((l) => <option key={l} value={l}>{levelLabels[l]}</option>)}
            </select>
          </div>
          {!isNew && (
            <div>
              <label className="label">Baholash usuli</label>
              <select className="input" value={form.scoringMode ?? "TOTAL"} onChange={(e) => setForm({ ...form, scoringMode: e.target.value as ScoringMode })}>
                {(Object.keys(scoringModeLabels) as ScoringMode[]).map((m) => <option key={m} value={m}>{scoringModeLabels[m]}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />Nashr etilgan (talabalar ko&apos;radi)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />Bosh sahifada tavsiya</label>
        </div>
        {isNew && <p className="text-xs text-slate-500">Nashr qilishdan oldin har bo&apos;limga savol (Listening bo&apos;lsa audio ham) qo&apos;shilgan bo&apos;lishi shart.</p>}
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : isNew ? "Imtihonni yaratish" : "Saqlash"}</button>
      </form>

      {!isNew && exam && (
        <>
          <section>
            <h2 className="mb-1 text-lg font-semibold">Bo&apos;limlar va materiallar</h2>
            <p className="mb-4 text-sm text-slate-500">Har bo&apos;lim uchun: yo&apos;riqnoma, Listening bo&apos;lsa audio, savollar (Reading uchun matn, Writing uchun grafik rasmi), konversiya jadvali. <Link href="/admin/guide" className="text-brand-700 underline">Yo&apos;riqnomani o&apos;qing</Link>.</p>
            <div className="space-y-4">
              {exam.sections.map((s) => <SectionEditor key={s.id} section={s} onChange={load} />)}
              <NewSection examId={examId} nextIndex={exam.sections.length + 1} onCreated={load} />
            </div>
          </section>
          <BandsEditor title="Umumiy konversiya (yakuniy natija va daraja yorlig'i)" hint={exam.scoringMode === "TOTAL" ? "Umumiy xom ball -> ball/daraja. Masalan TOPIK: 120-149 -> 3 (3-daraja)." : exam.scoringMode === "SECTION_AVERAGE" ? "Bo'limlar o'rtachasi (butun songa yaxlitlanadi) -> yorliq. Masalan CEFR: 65-79 -> B2. IELTS uchun bo'sh qoldiring." : "Yig'indi -> yorliq (ixtiyoriy)."}
            bands={exam.bands} withLabel onSave={async (rows) => setExam(await api.admin.setBands(examId, rows))} />
        </>
      )}
    </div>
  );
}

function NewSection({ examId, nextIndex, onCreated }: { examId: number; nextIndex: number; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SectionInput>({ title: "", partType: "GENERAL", orderIndex: nextIndex, durationMinutes: 30, defaultPoints: 1, instructions: "" });
  const [error, setError] = useState("");
  if (!open) return <button onClick={() => { setForm({ title: "", partType: "GENERAL", orderIndex: nextIndex, durationMinutes: 30, defaultPoints: 1, instructions: "" }); setOpen(true); }} className="btn-secondary w-full border-dashed">+ Bo&apos;lim qo&apos;shish</button>;
  return (
    <form className="card space-y-4 p-5" onSubmit={async (e) => { e.preventDefault(); setError(""); try { await api.admin.addSection(examId, form); setOpen(false); onCreated(); } catch (err) { setError(err instanceof ApiError ? err.message : "Xatolik"); } }}>
      {error && <Alert>{error}</Alert>}
      <SectionFields form={form} setForm={setForm} />
      <div className="flex gap-2"><button className="btn-primary">Qo&apos;shish</button><button type="button" onClick={() => setOpen(false)} className="btn-ghost">Bekor</button></div>
    </form>
  );
}

function SectionFields({ form, setForm }: { form: SectionInput; setForm: (f: SectionInput) => void }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_150px_90px_110px_110px]">
        <div><label className="label">Bo&apos;lim nomi</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div>
          <label className="label">Tur</label>
          <select className="input" value={form.partType} onChange={(e) => setForm({ ...form, partType: e.target.value as PartType })}>
            {(Object.keys(partTypeLabels) as PartType[]).map((p) => <option key={p} value={p}>{partTypeLabels[p]}</option>)}
          </select>
        </div>
        <div><label className="label">Tartib</label><input type="number" min={1} className="input" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })} /></div>
        <div><label className="label">Vaqt (daq)</label><input type="number" min={1} className="input" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></div>
        <div><label className="label">Standart ball</label><input type="number" min={0} step={0.1} className="input" value={form.defaultPoints ?? 1} onChange={(e) => setForm({ ...form, defaultPoints: Number(e.target.value) })} /></div>
      </div>
      <div><label className="label">Talabaga yo&apos;riqnoma (bo&apos;lim boshida)</label><textarea rows={2} className="input" value={form.instructions ?? ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
    </>
  );
}

function SectionEditor({ section, onChange }: { section: SectionAdminView; onChange: () => void }) {
  const [tab, setTab] = useState<"questions" | "settings" | "bands">("questions");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<SectionInput>({ title: section.title, partType: section.partType, orderIndex: section.orderIndex, durationMinutes: section.durationMinutes, defaultPoints: section.defaultPoints, instructions: section.instructions ?? "", audioKey: section.audioKey });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const saveSettings = async (patch?: Partial<SectionInput>) => {
    setError("");
    setMsg("");
    const data = { ...form, ...patch };
    setForm(data);
    try { await api.admin.updateSection(section.id, data); setMsg("Saqlandi"); onChange(); } catch (e) { setError(e instanceof ApiError ? e.message : "Xatolik"); }
  };

  const manualSection = section.questions.length > 0 && section.questions.every((q) => q.type === "ESSAY" || q.type === "SPEAKING");

  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{section.orderIndex}</span>
        <div className="flex-1">
          <p className="font-semibold">{section.title} <span className="badge ml-1 bg-slate-100 text-slate-600">{partTypeLabels[section.partType]}</span></p>
          <p className="text-xs text-slate-500">
            {section.durationMinutes} daq · {section.questions.length} ta {manualSection ? "vazifa (o'qituvchi baholaydi)" : "savol"} · standart {section.defaultPoints} ball
            {section.partType === "LISTENING" && (section.audioKey ? <span className="text-emerald-700"> · audio yuklangan</span> : <span className="text-red-600"> · audio yo&apos;q!</span>)}
            {section.bands.length > 0 && " · konversiya jadvali bor"}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
          {([["questions", "Savollar"], ["settings", "Sozlamalar va audio"], ["bands", "Konversiya"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("rounded-md px-2.5 py-1 font-medium", tab === k ? "bg-white shadow-sm" : "text-slate-600")}>{l}</button>
          ))}
        </div>
        {confirmDelete ? (
          <>
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Yo&apos;q</button>
            <button onClick={async () => { await api.admin.deleteSection(section.id); onChange(); }} className="btn-danger">Ha, o&apos;chirish</button>
          </>
        ) : <button onClick={() => setConfirmDelete(true)} className="btn-ghost text-red-600">O&apos;chirish</button>}
      </div>

      {tab === "settings" && (
        <form className="space-y-4 px-5 py-4" onSubmit={(e) => { e.preventDefault(); saveSettings(); }}>
          {error && <Alert>{error}</Alert>}
          {msg && <Alert type="success">{msg}</Alert>}
          <SectionFields form={form} setForm={setForm} />
          {(section.partType === "LISTENING" || form.partType === "LISTENING") && (
            <div>
              <MediaUpload kind="AUDIO" label="Listening audio (MP3). Bo'lim boshida avtomatik ko'rsatiladi, yuklab olib bo'lmaydi" value={form.audioKey ?? null} onChange={(key) => saveSettings({ audioKey: key })} />
              {section.audioUrl && <audio src={section.audioUrl} controls className="mt-3 w-full" />}
            </div>
          )}
          <button className="btn-primary">Sozlamalarni saqlash</button>
        </form>
      )}

      {tab === "bands" && (
        <div className="px-5 py-4">
          <BandsEditor title={`${section.title}: xom ball -> band/shkala`} hint={manualSection ? "Qo'lda baholanadigan bo'lim: jadval bo'sh bo'lsa o'qituvchi ballarining vaznli o'rtachasi band bo'ladi (IELTS Writing: Task 2 vazni 2)." : "To'g'ri javoblar soni (xom ball) -> band. Bo'sh bo'lsa xom ball o'zi natija bo'ladi."}
            bands={section.bands} onSave={async (rows) => { await api.admin.setSectionBands(section.id, rows); onChange(); }} />
        </div>
      )}

      {tab === "questions" && (
        <>
          <ul className="divide-y divide-slate-100">
            {section.questions.map((q) => (
              <li key={q.id} className="px-5 py-4">
                {editingId === q.id ? (
                  <QuestionForm initial={{ orderIndex: q.orderIndex, type: q.type, prompt: q.prompt, passage: q.passage, options: q.options, accepted: q.accepted, points: q.points, weight: q.weight, imageKey: q.imageKey, minWords: q.minWords, prepSeconds: q.prepSeconds, answerSeconds: q.answerSeconds }}
                    imageUrl={q.imageUrl} onCancel={() => setEditingId(null)} onSave={async (d) => { await api.admin.updateQuestion(q.id, d); setEditingId(null); onChange(); }} />
                ) : (
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="mt-0.5 text-sm font-semibold text-slate-500">{q.orderIndex}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm">{q.prompt}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {questionTypeLabels[q.type]} · {q.points} ball{q.weight !== 1 && ` · vazn ${q.weight}`}
                        {q.type === "ESSAY" || q.type === "SPEAKING" ? "" : <> · to&apos;g&apos;ri: <span className="font-mono">{q.accepted.join(", ") || "—"}</span></>}
                        {q.minWords != null && ` · min ${q.minWords} so'z`}{q.answerSeconds != null && ` · ${q.answerSeconds}s javob`}{q.imageKey && " · rasm"}{q.passage && " · matn"}
                      </p>
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
              <QuestionForm initial={defaultQuestion(section)} onCancel={() => setAdding(false)} onSave={async (d) => { await api.admin.addQuestion(section.id, d); setAdding(false); onChange(); }} />
            ) : <button onClick={() => setAdding(true)} className="btn-secondary w-full border-dashed">+ Savol / vazifa qo&apos;shish</button>}
          </div>
        </>
      )}
    </div>
  );
}

function defaultQuestion(s: SectionAdminView): ExamQuestionInput {
  const base = { orderIndex: s.questions.length + 1, prompt: "", passage: null, points: s.defaultPoints, weight: 1, imageKey: null, minWords: null, prepSeconds: null, answerSeconds: null, accepted: [] as string[] };
  if (s.partType === "WRITING") return { ...base, type: "ESSAY", options: null, minWords: 150 };
  if (s.partType === "SPEAKING") return { ...base, type: "SPEAKING", options: null, prepSeconds: 10, answerSeconds: 120 };
  return { ...base, type: "SINGLE_CHOICE", options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }] };
}

const TF_OPTIONS = [{ key: "TRUE", text: "True" }, { key: "FALSE", text: "False" }, { key: "NG", text: "Not Given" }];

function QuestionForm({ initial, imageUrl, onSave, onCancel }: { initial: ExamQuestionInput; imageUrl?: string | null; onSave: (d: ExamQuestionInput) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState<ExamQuestionInput>(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const choice = f.type === "SINGLE_CHOICE" || f.type === "MULTI_CHOICE" || f.type === "MATCHING";
  const multi = f.type === "MULTI_CHOICE" || f.type === "MATCHING";
  const manual = f.type === "ESSAY" || f.type === "SPEAKING";
  const options = f.options ?? [];

  const setType = (type: QuestionType) => {
    if (type === "TRUE_FALSE_NG") setF({ ...f, type, options: TF_OPTIONS, accepted: [] });
    else if (type === "GAP_FILL") setF({ ...f, type, options: null, accepted: [] });
    else if (type === "ESSAY") setF({ ...f, type, options: null, accepted: [], minWords: f.minWords ?? 150 });
    else if (type === "SPEAKING") setF({ ...f, type, options: null, accepted: [], prepSeconds: f.prepSeconds ?? 10, answerSeconds: f.answerSeconds ?? 120 });
    else setF({ ...f, type, options: options.length ? options : [{ key: "A", text: "" }, { key: "B", text: "" }], accepted: [] });
  };
  const toggleAccepted = (key: string) => setF({ ...f, accepted: multi ? (f.accepted.includes(key) ? f.accepted.filter((k) => k !== key) : [...f.accepted, key]) : [key] });

  return (
    <form className="space-y-4 rounded-xl bg-slate-50 p-4" onSubmit={async (e) => { e.preventDefault(); setSaving(true); setError(""); try { await onSave({ ...f, options: choice || f.type === "TRUE_FALSE_NG" ? f.options : null }); } catch (err) { setError(err instanceof ApiError ? err.message : "Xatolik"); setSaving(false); } }}>
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-[80px_1fr_100px_90px]">
        <div><label className="label">Tartib</label><input type="number" min={1} className="input" value={f.orderIndex} onChange={(e) => setF({ ...f, orderIndex: Number(e.target.value) })} /></div>
        <div>
          <label className="label">Savol turi</label>
          <select className="input" value={f.type} onChange={(e) => setType(e.target.value as QuestionType)}>
            {(Object.keys(questionTypeLabels) as QuestionType[]).map((t) => <option key={t} value={t}>{questionTypeLabels[t]}</option>)}
          </select>
        </div>
        <div><label className="label">{manual ? "Maks. ball" : "Ball"}</label><input type="number" min={0} step={0.1} className="input" value={f.points} onChange={(e) => setF({ ...f, points: Number(e.target.value) })} /></div>
        {manual && <div><label className="label">Vazn</label><input type="number" min={0.5} step={0.5} className="input" value={f.weight ?? 1} onChange={(e) => setF({ ...f, weight: Number(e.target.value) })} /></div>}
      </div>
      <div><label className="label">{manual ? "Vazifa matni (topshiriq, mavzu, cue card)" : "Savol"}</label><textarea rows={manual ? 4 : 2} required className="input" value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} /></div>
      <div><label className="label">Matn / parcha (Reading matni, Listening transkripti o&apos;qituvchi uchun emas; talabaga ko&apos;rinadi)</label><textarea rows={3} className="input" value={f.passage ?? ""} onChange={(e) => setF({ ...f, passage: e.target.value || null })} /></div>
      <MediaUpload kind="IMAGE" label="Rasm (grafik, jadval, diagramma, cue card) — ixtiyoriy" value={f.imageKey ?? null} onChange={(key) => setF({ ...f, imageKey: key })} />
      {imageUrl && f.imageKey === initial.imageKey && f.imageKey && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="max-h-48 rounded-lg border border-slate-200" />
      )}

      {(choice || f.type === "TRUE_FALSE_NG") && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{multi ? "To'g'ri javoblarni belgilang (bir nechta)." : "To'g'ri javobni belgilang."}</p>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type={multi ? "checkbox" : "radio"} name="acc" className="accent-emerald-600" checked={f.accepted.includes(o.key)} onChange={() => toggleAccepted(o.key)} />
              <input className="input w-16 font-mono" value={o.key} disabled={f.type === "TRUE_FALSE_NG"} onChange={(e) => setF({ ...f, options: options.map((x, j) => (j === i ? { ...x, key: e.target.value.toUpperCase() } : x)) })} />
              <input className="input flex-1" required placeholder="Variant matni" value={o.text} disabled={f.type === "TRUE_FALSE_NG"} onChange={(e) => setF({ ...f, options: options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
              {choice && options.length > 2 && <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => setF({ ...f, options: options.filter((_, j) => j !== i), accepted: f.accepted.filter((k) => k !== o.key) })}>✕</button>}
            </div>
          ))}
          {choice && options.length < 8 && <button type="button" className="btn-ghost text-sm" onClick={() => setF({ ...f, options: [...options, { key: String.fromCharCode(65 + options.length), text: "" }] })}>+ Variant</button>}
        </div>
      )}
      {f.type === "GAP_FILL" && (
        <div>
          <label className="label">Qabul qilinadigan javoblar (vergul bilan; katta-kichik harf va ortiqcha bo&apos;shliq farqsiz)</label>
          <input className="input" required placeholder="colour, color" value={f.accepted.join(", ")} onChange={(e) => setF({ ...f, accepted: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
        </div>
      )}
      {f.type === "ESSAY" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Minimal so&apos;z soni</label><input type="number" min={0} className="input" value={f.minWords ?? ""} onChange={(e) => setF({ ...f, minWords: e.target.value ? Number(e.target.value) : null })} /></div>
          <p className="self-end text-xs text-slate-500">Talaba yozganda so&apos;z hisobi ko&apos;rinadi. Siz tekshiruv panelida 0 dan maks. ballgacha baho qo&apos;yasiz.</p>
        </div>
      )}
      {f.type === "SPEAKING" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Tayyorlanish (soniya)</label><input type="number" min={0} className="input" value={f.prepSeconds ?? 0} onChange={(e) => setF({ ...f, prepSeconds: Number(e.target.value) })} /></div>
          <div><label className="label">Javob vaqti (soniya)</label><input type="number" min={10} className="input" value={f.answerSeconds ?? 120} onChange={(e) => setF({ ...f, answerSeconds: Number(e.target.value) })} /></div>
          <p className="self-end text-xs text-slate-500">Talaba mikrofon orqali bir marta yozadi; siz tekshiruvda eshitib baholaysiz.</p>
        </div>
      )}
      <div className="flex gap-2">
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Bekor qilish</button>
      </div>
    </form>
  );
}

function BandsEditor({ title, hint, bands, withLabel, onSave }: { title: string; hint: string; bands: BandRow[]; withLabel?: boolean; onSave: (rows: BandRow[]) => Promise<void> }) {
  const [rows, setRows] = useState<BandRow[]>(bands);
  const [open, setOpen] = useState(bands.length > 0 && bands.length <= 12);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  useEffect(() => setRows(bands), [bands]);
  const set = (i: number, patch: Partial<BandRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <section>
      <div className="flex items-center justify-between">
        <div><h3 className="font-semibold">{title}</h3><p className="text-xs text-slate-500">{hint}</p></div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn-ghost">{open ? "Yopish" : `${bands.length} qator · ochish`}</button>
      </div>
      {open && (
        <div className="card mt-3 p-5">
          {error && <Alert className="mb-3">{error}</Alert>}
          {msg && <Alert type="success" className="mb-3">{msg}</Alert>}
          <div className={cn("grid gap-2 text-xs font-semibold text-slate-500 uppercase", withLabel ? "grid-cols-[1fr_1fr_1fr_1fr_auto]" : "grid-cols-[1fr_1fr_1fr_auto]")}><span>Min xom</span><span>Max xom</span><span>Band / ball</span>{withLabel && <span>Yorliq</span>}<span /></div>
          <div className="max-h-80 overflow-y-auto">
            {rows.map((r, i) => (
              <div key={i} className={cn("mt-2 grid gap-2", withLabel ? "grid-cols-[1fr_1fr_1fr_1fr_auto]" : "grid-cols-[1fr_1fr_1fr_auto]")}>
                <input type="number" className="input" value={r.minRaw} onChange={(e) => set(i, { minRaw: Number(e.target.value) })} />
                <input type="number" className="input" value={r.maxRaw} onChange={(e) => set(i, { maxRaw: Number(e.target.value) })} />
                <input type="number" step="0.5" className="input" value={r.scaled} onChange={(e) => set(i, { scaled: Number(e.target.value) })} />
                {withLabel && <input className="input" placeholder="B2 / 4-daraja" value={r.label ?? ""} onChange={(e) => set(i, { label: e.target.value || null })} />}
                <button type="button" className="btn-ghost text-red-600" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setRows([...rows, { minRaw: (rows.at(-1)?.maxRaw ?? -1) + 1, maxRaw: (rows.at(-1)?.maxRaw ?? -1) + 1, scaled: 0, label: null }])}>+ Qator</button>
            <button type="button" className="btn-primary" onClick={async () => { setError(""); setMsg(""); try { await onSave(rows); setMsg("Saqlandi"); } catch (err) { setError(err instanceof ApiError ? err.message : "Xatolik"); } }}>Jadvalni saqlash</button>
          </div>
        </div>
      )}
    </section>
  );
}
