"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { XIcon } from "@/components/ui/Icons";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError, type QuizInput } from "@/lib/api";
import type { Lesson } from "@/lib/types";

type QuestionDraft = QuizInput["questions"][number];
const newQuestion = (): QuestionDraft => ({ text: "", options: [{ text: "", correct: true }, { text: "", correct: false }, { text: "", correct: false }] });

export default function QuizEditorPage() {
  const params = useParams<{ id: string; quizId: string }>();
  const courseId = Number(params.id);
  const isNew = params.quizId === "new";
  const router = useRouter();
  const [form, setForm] = useState<QuizInput | null>(isNew ? { title: "Yakuniy test", description: "", passScore: 70, lessonId: null, questions: [newQuestion()] } : null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api.admin.course(courseId).then((c) => setLessons(c.lessons)).catch(() => undefined);
    if (!isNew) {
      api.admin.quiz(Number(params.quizId))
        .then((q) => setForm({ title: q.title, description: q.description, passScore: q.passScore, lessonId: q.lessonId, questions: q.questions.map((qq) => ({ text: qq.text, options: qq.options.map((o) => ({ text: o.text, correct: o.correct })) })) }))
        .catch((e) => setError(e instanceof ApiError ? e.message : "Testni yuklab bo'lmadi"));
    }
  }, [courseId, isNew, params.quizId]);

  if (!form) return error ? <Alert>{error}</Alert> : <PageLoader />;

  const updateQuestion = (qi: number, patch: Partial<QuestionDraft>) => setForm({ ...form, questions: form.questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isNew) await api.admin.createQuiz(courseId, form);
      else await api.admin.updateQuiz(Number(params.quizId), form);
      router.push(`/admin/courses/${courseId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlashda xatolik");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/admin/courses/${courseId}`} className="text-sm text-slate-500 hover:underline">← Kursga qaytish</Link>
          <h1 className="mt-1 text-2xl font-bold">{isNew ? "Yangi test" : "Testni tahrirlash"}</h1>
        </div>
        {!isNew && (confirmDelete ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost">Bekor</button>
            <button type="button" onClick={async () => { await api.admin.deleteQuiz(Number(params.quizId)); router.push(`/admin/courses/${courseId}`); }} className="btn-danger">Ha, o&apos;chirish</button>
          </div>
        ) : <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger">O&apos;chirish</button>)}
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="card grid gap-5 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Test nomi</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="label">Tavsif</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><label className="label">O&apos;tish bali (%)</label><input type="number" min={1} max={100} className="input" value={form.passScore} onChange={(e) => setForm({ ...form, passScore: Number(e.target.value) })} /></div>
        <div>
          <label className="label">Bog&apos;langan dars (ixtiyoriy)</label>
          <select className="input" value={form.lessonId ?? ""} onChange={(e) => setForm({ ...form, lessonId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Yakuniy test</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>
      </div>

      {form.questions.map((q, qi) => (
        <div key={qi} className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{qi + 1}-savol</h3>
            {form.questions.length > 1 && <button type="button" className="btn-ghost text-red-600" onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== qi) })}>Savolni o&apos;chirish</button>}
          </div>
          <textarea rows={2} required className="input" placeholder="Savol matni" value={q.text} onChange={(e) => updateQuestion(qi, { text: e.target.value })} />
          <p className="text-xs text-slate-500">To&apos;g&apos;ri javobni doira orqali belgilang.</p>
          {q.options.map((o, oi) => (
            <div key={oi} className="flex items-center gap-3">
              <input type="radio" name={`correct-${qi}`} className="accent-emerald-600" checked={o.correct} onChange={() => updateQuestion(qi, { options: q.options.map((x, i) => ({ ...x, correct: i === oi })) })} />
              <input required className="input" placeholder={`${oi + 1}-variant`} value={o.text} onChange={(e) => updateQuestion(qi, { options: q.options.map((x, i) => (i === oi ? { ...x, text: e.target.value } : x)) })} />
              {q.options.length > 2 && (
                <button type="button" aria-label="Variantni o'chirish" className="text-slate-400 hover:text-red-600"
                  onClick={() => { const options = q.options.filter((_, i) => i !== oi); if (!options.some((x) => x.correct)) options[0].correct = true; updateQuestion(qi, { options }); }}>
                  <XIcon width={18} height={18} />
                </button>
              )}
            </div>
          ))}
          {q.options.length < 8 && <button type="button" className="btn-ghost text-sm" onClick={() => updateQuestion(qi, { options: [...q.options, { text: "", correct: false }] })}>+ Variant qo&apos;shish</button>}
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-secondary" onClick={() => setForm({ ...form, questions: [...form.questions, newQuestion()] })}>+ Savol qo&apos;shish</button>
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : "Testni saqlash"}</button>
      </div>
    </form>
  );
}
