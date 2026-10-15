"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { Timer } from "@/components/exam/Timer";
import { Alert } from "@/components/ui/Alert";
import { CheckIcon, ChevronLeftIcon, LockIcon, TimerIcon } from "@/components/ui/Icons";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn, partTypeLabels } from "@/lib/format";
import type { AnswerResponse, AttemptView, ExamDetail, SectionState } from "@/lib/types";

/**
 * Imtihon oqimi: bo'limlar ketma-ket. Har bo'lim: yo'riqnoma -> "Boshlash" -> taymer -> savollar -> "Yakunlash".
 * Oxirgi bo'lim yakunlangach natija sahifasi.
 */
export default function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerResponse>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
    if (r.audioKey) return; // ovozli javob allaqachon serverda
    clearTimeout(timers.current[questionId]);
    timers.current[questionId] = setTimeout(async () => {
      delete timers.current[questionId];
      setSaving(true);
      try { await api.attempts.answer(id, questionId, r); } catch (e) { setError(e instanceof ApiError ? e.message : "Saqlashda xatolik"); } finally { setSaving(false); }
    }, 600);
  }, [id]);

  const flush = useCallback(async () => {
    const pending = Object.keys(timers.current);
    pending.forEach((qid) => clearTimeout(timers.current[qid]));
    timers.current = {};
    await Promise.all(pending.map((qid) => api.attempts.answer(id, Number(qid), answersRef.current[qid]).catch(() => undefined)));
  }, [id]);

  const startSection = async (sectionId: number) => {
    setBusy(true);
    setError("");
    try { setAttempt(await api.attempts.startSection(id, sectionId)); window.scrollTo({ top: 0 }); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Xatolik"); }
    finally { setBusy(false); }
  };

  const finishSection = useCallback(async (sectionId: number) => {
    setBusy(true);
    setConfirming(false);
    await flush();
    try {
      const a = await api.attempts.finishSection(id, sectionId);
      if (a.status !== "IN_PROGRESS") return router.replace(`/attempts/${id}/result`);
      setAttempt(a);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }, [flush, id, router]);

  if (error && !attempt) return <div className="container-page py-10"><Alert>{error}</Alert></div>;
  if (!attempt || !exam) return <PageLoader />;

  const states = attempt.sections;
  const current = states.find((s) => s.status === "OPEN") ?? null;
  const next = states.find((s) => s.status === "LOCKED") ?? null;
  const allDone = !current && !next;
  const section = current ? exam.sections.find((s) => s.id === current.sectionId) ?? null : null;
  const answeredIn = (s: SectionState) => exam.sections.find((x) => x.id === s.sectionId)?.questions.filter((q) => answers[q.id]).length ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 text-white">
        <Link href={`/exams/${exam.id}`} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white"><ChevronLeftIcon width={18} height={18} /><span className="hidden sm:inline">Chiqish</span></Link>
        <span className="h-5 w-px bg-slate-700" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{exam.title}</h1>
          <p className="text-xs text-slate-400">{current ? `${partTypeLabels[current.partType]} · ${current.title}` : "Bo'limlar orasida"} {saving && "· saqlanmoqda..."}</p>
        </div>
        {current?.endsAt && <Timer key={current.sectionId} expiresAt={current.endsAt} onExpire={() => finishSection(current.sectionId)} />}
      </header>

      <div className="container-page grid flex-1 gap-8 py-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {error && <Alert>{error}</Alert>}

          {/* Bo'lim ochiq: savollar */}
          {current && section && (
            <>
              {section.instructions && <Alert type="info" className="whitespace-pre-line">{section.instructions}</Alert>}
              {section.audioUrl && (
                <div className="card p-4" onContextMenu={(e) => e.preventDefault()}>
                  <p className="mb-2 text-sm font-semibold">🎧 {section.title}: audio</p>
                  <audio key={section.audioUrl} src={section.audioUrl} controls controlsList="nodownload noplaybackrate" className="w-full" />
                  <p className="mt-1 text-xs text-slate-500">Haqiqiy imtihondagidek audio bir marta eshitiladi deb hisoblang.</p>
                </div>
              )}
              {section.questions.map((q) => <QuestionCard key={q.id} q={q} value={answers[q.id]} onChange={(r) => onChange(q.id, r)} attemptId={attempt.id} />)}
              <div className="card flex flex-wrap items-center justify-end gap-3 p-4">
                {confirming ? (
                  <>
                    <span className="text-sm text-slate-600">
                      {answeredIn(current) < current.questionCount ? `${current.questionCount - answeredIn(current)} ta savol javobsiz. ` : ""}
                      Bo&apos;limni yakunlaysizmi? Qaytib bo&apos;lmaydi.
                    </span>
                    <button onClick={() => setConfirming(false)} disabled={busy} className="btn-secondary">Bekor qilish</button>
                    <button onClick={() => finishSection(current.sectionId)} disabled={busy} className="btn bg-emerald-600 text-white hover:bg-emerald-700">{busy ? "Yakunlanmoqda..." : next ? "Ha, keyingi bo'limga" : "Ha, imtihonni topshirish"}</button>
                  </>
                ) : (
                  <button onClick={() => setConfirming(true)} className="btn bg-emerald-600 text-white hover:bg-emerald-700">{next ? "Bo'limni yakunlash →" : "Imtihonni topshirish"}</button>
                )}
              </div>
            </>
          )}

          {/* Bo'limlar orasida: keyingi bo'lim yo'riqnomasi */}
          {!current && next && (() => {
            const sec = exam.sections.find((s) => s.id === next.sectionId);
            return (
              <div className="card mx-auto max-w-2xl p-8 text-center">
                <span className="badge bg-brand-50 text-brand-700">{next.orderIndex}-bo&apos;lim / {states.length}</span>
                <h2 className="mt-3 text-2xl font-bold">{next.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{partTypeLabels[next.partType]} · {next.durationMinutes} daqiqa · {next.questionCount} ta {next.partType === "WRITING" || next.partType === "SPEAKING" ? "vazifa" : "savol"}</p>
                {(sec?.instructions || exam.instructions) && (
                  <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-left text-sm leading-relaxed text-slate-700">{sec?.instructions ?? exam.instructions}</p>
                )}
                {next.partType === "SPEAKING" && <p className="mt-4 text-sm text-amber-700">Mikrofon kerak. Brauzer ruxsat so&apos;raganda &quot;Ruxsat berish&quot;ni bosing.</p>}
                {next.partType === "LISTENING" && <p className="mt-4 text-sm text-amber-700">Quloqchin tayyorlang: audio bo&apos;lim boshida ochiladi.</p>}
                <p className="mt-4 text-xs text-slate-500">&quot;Boshlash&quot;ni bosganingizdan so&apos;ng {next.durationMinutes} daqiqalik taymer ishga tushadi va to&apos;xtatib bo&apos;lmaydi.</p>
                <button onClick={() => startSection(next.sectionId)} disabled={busy} className="btn-primary btn-lg mt-6">{busy ? "..." : `${next.title} bo'limini boshlash`}</button>
              </div>
            );
          })()}

          {allDone && (
            <div className="card mx-auto max-w-2xl p-8 text-center">
              <h2 className="text-2xl font-bold">Barcha bo&apos;limlar yakunlandi</h2>
              <button onClick={async () => { await flush(); try { await api.attempts.submit(id); } catch { /* allaqachon baholangan */ } router.replace(`/attempts/${id}/result`); }} className="btn-primary btn-lg mt-6">Natijani ko&apos;rish</button>
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-20 p-4">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Imtihon tuzilmasi</p>
            <ol className="mt-3 space-y-2">
              {states.map((s) => (
                <li key={s.sectionId} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2 text-sm", s.status === "OPEN" ? "border-brand-300 bg-brand-50" : s.status === "FINISHED" ? "border-emerald-200 bg-emerald-50" : "border-slate-200")}>
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", s.status === "FINISHED" ? "bg-emerald-500 text-white" : s.status === "OPEN" ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600")}>
                    {s.status === "FINISHED" ? <CheckIcon width={12} height={12} strokeWidth={3} /> : s.status === "LOCKED" ? <LockIcon width={11} height={11} /> : s.orderIndex}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="text-xs text-slate-500">{s.durationMinutes} daq · {s.status === "OPEN" ? `${answeredIn(s)}/${s.questionCount} javob` : `${s.questionCount} savol`}</p>
                  </div>
                  {s.status === "OPEN" && <TimerIcon width={16} height={16} className="text-brand-600" />}
                </li>
              ))}
            </ol>
            {current && section && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-1.5 text-xs text-slate-500">Savollar</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {section.questions.map((q) => (
                    <a key={q.id} href={`#q-${q.id}`} className={cn("flex h-8 items-center justify-center rounded-md text-xs font-medium", answers[q.id] ? "bg-brand-600 text-white" : "border border-slate-300 bg-white text-slate-600")}>{q.orderIndex}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
