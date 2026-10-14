"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Attempts, Exams, type AnswerResponse, type AttemptView, type ExamDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import QuestionCard from "@/components/QuestionCard";
import Timer from "@/components/Timer";

export default function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerResponse>>({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const answersRef = useRef<Record<string, AnswerResponse>>({});
  answersRef.current = answers;

  useEffect(() => {
    if (loading) return;
    if (!user) return router.push("/login");
    (async () => {
      try {
        const a = await Attempts.get(id);
        if (a.status !== "IN_PROGRESS") return router.replace(`/attempts/${id}/result`);
        setAttempt(a);
        setAnswers(a.answers ?? {});
        setExam(await Exams.get(a.examId));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id, user, loading, router]);

  // Debounce'li avtosaqlash (har savol uchun 600ms)
  const onChange = useCallback(
    (questionId: number, r: AnswerResponse) => {
      setAnswers((prev) => ({ ...prev, [questionId]: r }));
      clearTimeout(timers.current[questionId]);
      timers.current[questionId] = setTimeout(async () => {
        setSaving(true);
        try {
          await Attempts.answer(id, questionId, r);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [id],
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    // Debounce kutayotgan javoblarni topshirishdan oldin darhol yuboramiz
    const pending = Object.keys(timers.current);
    pending.forEach((qid) => clearTimeout(timers.current[qid]));
    timers.current = {};
    try {
      await Promise.all(
        pending.map((qid) => Attempts.answer(id, Number(qid), answersRef.current[qid]).catch(() => undefined)),
      );
      await Attempts.submit(id);
    } catch {
      /* vaqt tugagan bo'lsa server allaqachon baholagan */
    }
    router.replace(`/attempts/${id}/result`);
  }, [id, router]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!attempt || !exam) return <p>Yuklanmoqda...</p>;

  const section = exam.sections[sectionIdx];
  const answered = Object.keys(answers).length;
  const total = exam.sections.reduce((s, x) => s + x.questions.length, 0);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border bg-white p-3">
        <div>
          <div className="font-semibold">{exam.title}</div>
          <div className="text-xs text-slate-500">
            {answered}/{total} javob berildi {saving && "· saqlanmoqda..."}
          </div>
        </div>
        <Timer expiresAt={attempt.expiresAt} onExpire={submit} />
      </div>

      <div className="flex gap-2">
        {exam.sections.map((s, i) => (
          <button key={s.id} onClick={() => setSectionIdx(i)}
                  className={`rounded px-3 py-1 text-sm ${i === sectionIdx ? "bg-slate-900 text-white" : "border bg-white"}`}>
            {s.title}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {section.questions.map((q) => (
          <QuestionCard key={q.id} q={q} value={answers[q.id]} onChange={(r) => onChange(q.id, r)} />
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        {confirming ? (
          <>
            <span className="text-sm text-slate-600">
              {answered < total ? `${total - answered} ta savol javobsiz. ` : ""}Imtihonni topshirasizmi?
            </span>
            <button onClick={() => setConfirming(false)} disabled={submitting}
                    className="rounded border bg-white px-4 py-2">
              Bekor qilish
            </button>
            <button onClick={submit} disabled={submitting}
                    className="rounded bg-green-700 px-5 py-2 text-white disabled:opacity-50">
              {submitting ? "Topshirilmoqda..." : "Ha, topshirish"}
            </button>
          </>
        ) : (
          <button onClick={() => setConfirming(true)} className="rounded bg-green-700 px-5 py-2 text-white">
            Topshirish
          </button>
        )}
      </div>
    </div>
  );
}
