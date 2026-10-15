"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { Timer } from "@/components/exam/Timer";
import { Alert } from "@/components/ui/Alert";
import { ChevronLeftIcon } from "@/components/ui/Icons";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/format";
import type { AnswerResponse, AttemptView, ExamDetail } from "@/lib/types";

export default function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerResponse>>({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const answersRef = useRef<Record<string, AnswerResponse>>({});
  answersRef.current = answers;

  useEffect(() => {
    if (loading) return;
    if (!user) return router.push(`/login?next=/attempts/${id}`);
    (async () => {
      try {
        const a = await api.attempts.get(id);
        if (a.status !== "IN_PROGRESS") return router.replace(`/attempts/${id}/result`);
        setAttempt(a);
        setAnswers(a.answers ?? {});
        setExam(await api.exams.get(a.examId));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi");
      }
    })();
  }, [id, user, loading, router]);

  const onChange = useCallback((questionId: number, r: AnswerResponse) => {
    setAnswers((prev) => ({ ...prev, [questionId]: r }));
    clearTimeout(timers.current[questionId]);
    timers.current[questionId] = setTimeout(async () => {
      delete timers.current[questionId];
      setSaving(true);
      try {
        await api.attempts.answer(id, questionId, r);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Saqlashda xatolik");
      } finally {
        setSaving(false);
      }
    }, 600);
  }, [id]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    const pending = Object.keys(timers.current);
    pending.forEach((qid) => clearTimeout(timers.current[qid]));
    timers.current = {};
    try {
      await Promise.all(pending.map((qid) => api.attempts.answer(id, Number(qid), answersRef.current[qid]).catch(() => undefined)));
      await api.attempts.submit(id);
    } catch {
      /* vaqt tugagan bo'lsa server allaqachon baholagan */
    }
    router.replace(`/attempts/${id}/result`);
  }, [id, router]);

  if (error && !attempt) return <div className="container-page py-10"><Alert>{error}</Alert></div>;
  if (!attempt || !exam) return <PageLoader />;

  const section = exam.sections[sectionIdx];
  const answered = Object.keys(answers).length;
  const total = exam.sections.reduce((s, x) => s + x.questions.length, 0);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 text-white">
        <Link href={`/exams/${exam.id}`} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white"><ChevronLeftIcon width={18} height={18} /><span className="hidden sm:inline">Chiqish</span></Link>
        <span className="h-5 w-px bg-slate-700" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{exam.title}</h1>
          <p className="text-xs text-slate-400">{answered}/{total} javob berildi {saving && "· saqlanmoqda..."}</p>
        </div>
        <Timer expiresAt={attempt.expiresAt} onExpire={submit} />
      </header>

      <div className="container-page grid flex-1 gap-8 py-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          {exam.sections.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {exam.sections.map((s, i) => (
                <button key={s.id} onClick={() => setSectionIdx(i)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", i === sectionIdx ? "bg-slate-900 text-white" : "border border-slate-300 bg-white")}>{s.title}</button>
              ))}
            </div>
          )}
          {error && <Alert>{error}</Alert>}
          {section.audioUrl && (
            <div className="card p-4" onContextMenu={(e) => e.preventDefault()}>
              <p className="mb-2 text-sm font-semibold">{section.title}: audio</p>
              <audio key={section.audioUrl} src={section.audioUrl} controls controlsList="nodownload noplaybackrate" className="w-full" />
              <p className="mt-1 text-xs text-slate-500">Haqiqiy imtihondagidek audio faqat bir marta eshitiladi deb hisoblang.</p>
            </div>
          )}
          {section.questions.map((q) => <QuestionCard key={q.id} q={q} value={answers[q.id]} onChange={(r) => onChange(q.id, r)} />)}

          <div className="card flex flex-wrap items-center justify-end gap-3 p-4">
            {confirming ? (
              <>
                <span className="text-sm text-slate-600">{answered < total ? `${total - answered} ta savol javobsiz. ` : ""}Imtihonni topshirasizmi?</span>
                <button onClick={() => setConfirming(false)} disabled={submitting} className="btn-secondary">Bekor qilish</button>
                <button onClick={submit} disabled={submitting} className="btn bg-emerald-600 text-white hover:bg-emerald-700">{submitting ? "Topshirilmoqda..." : "Ha, topshirish"}</button>
              </>
            ) : (
              <button onClick={() => setConfirming(true)} className="btn bg-emerald-600 text-white hover:bg-emerald-700">Topshirish</button>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-20 p-4">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Savollar</p>
            {exam.sections.map((s) => (
              <div key={s.id} className="mt-3">
                <p className="mb-1.5 text-xs text-slate-500">{s.title}</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {s.questions.map((q) => (
                    <a key={q.id} href={`#q-${q.id}`} onClick={() => setSectionIdx(exam.sections.indexOf(s))}
                      className={cn("flex h-8 items-center justify-center rounded-md text-xs font-medium", answers[q.id] ? "bg-brand-600 text-white" : "border border-slate-300 bg-white text-slate-600")}>
                      {q.orderIndex}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
