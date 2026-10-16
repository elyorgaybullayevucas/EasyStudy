"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { ListeningPlayer } from "@/components/exam/ListeningPlayer";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { Timer } from "@/components/exam/Timer";
import { Alert } from "@/components/ui/Alert";
import { CheckIcon, ChevronLeftIcon, LockIcon, TimerIcon } from "@/components/ui/Icons";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn, partTypeLabels } from "@/lib/format";
import type { AnswerResponse, AttemptView, ExamDetail, QuestionView, SectionState, SectionView } from "@/lib/types";

type Group = { passage: string | null; questions: QuestionView[] };

/** Matnli (passage) savol yangi guruhni boshlaydi: Reading'da matn, Listening'da qism sarlavhasi. */
function groupQuestions(qs: QuestionView[]): Group[] {
  const groups: Group[] = [];
  for (const q of qs) {
    if (q.passage || groups.length === 0) groups.push({ passage: q.passage, questions: [q] });
    else groups[groups.length - 1].questions.push(q);
  }
  return groups;
}

/**
 * Imtihon oqimi (haqiqiy computer-delivered format):
 *  - SEQUENTIAL (IELTS, SAT, TOPIK): bo'limlar ketma-ket, har birining taymeri; Listening audiosi avtomatik va bir marta;
 *    Reading - matn chapda, savollar o'ngda (Passage tablari); Writing - topshiriq chapda, javob o'ngda; Speaking - savolma-savol.
 *  - FREE (DTM, Attestatsiya): barcha fanlar bir vaqtda ochiq, yagona taymer, 1-90 raqamlash, erkin yurish, "Topshirish".
 *  - Har savolda "Review" belgisi va pastki navigatsiya paneli (CBT'dagidek).
 */
export default function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerResponse>>({});
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null); // FREE rejim
  const [activeGroup, setActiveGroup] = useState<Record<number, number>>({}); // Reading/Writing tablari
  const [spkIndex, setSpkIndex] = useState<Record<number, number>>({}); // Speaking: joriy savol
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
        try { const f = sessionStorage.getItem(`flags-${id}`); if (f) setFlagged(new Set(JSON.parse(f) as number[])); } catch { /* ignore */ }
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi");
      }
    })();
  }, [id, user, loading, router]);

  const toggleFlag = (qid: number) => setFlagged((prev) => {
    const n = new Set(prev);
    if (n.has(qid)) n.delete(qid); else n.add(qid);
    try { sessionStorage.setItem(`flags-${id}`, JSON.stringify([...n])); } catch { /* ignore */ }
    return n;
  });

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

  const submitAll = useCallback(async () => {
    setBusy(true);
    setConfirming(false);
    await flush();
    try { await api.attempts.submit(id); } catch { /* vaqt tugagan bo'lsa server allaqachon baholagan */ }
    router.replace(`/attempts/${id}/result`);
  }, [flush, id, router]);

  const free = attempt?.navigationMode === "FREE";
  const states = attempt?.sections ?? [];
  const offsets = useMemo(() => { // FREE: 1-90 ketma-ket raqamlash
    const o: Record<number, number> = {};
    let n = 0;
    for (const s of states) { o[s.sectionId] = n; n += s.questionCount; }
    return o;
  }, [states]);

  if (error && !attempt) return <div className="container-page py-10"><Alert>{error}</Alert></div>;
  if (!attempt || !exam) return <PageLoader />;

  const current = free ? (states.find((s) => s.sectionId === (activeSectionId ?? states[0]?.sectionId)) ?? null) : (states.find((s) => s.status === "OPEN") ?? null);
  const next = free ? null : (states.find((s) => s.status === "LOCKED") ?? null);
  const allDone = !free && !current && !next;
  const section = current ? exam.sections.find((s) => s.id === current.sectionId) ?? null : null;
  const answeredIn = (s: SectionState) => exam.sections.find((x) => x.id === s.sectionId)?.questions.filter((q) => answers[q.id]).length ?? 0;
  const totalAnswered = exam.sections.reduce((n, s) => n + s.questions.filter((q) => answers[q.id]).length, 0);
  const totalQuestions = exam.sections.reduce((n, s) => n + s.questions.length, 0);
  const timerEnds = free ? attempt.expiresAt : current?.endsAt ?? null;
  const num = (s: SectionView, q: QuestionView) => free ? offsets[s.id] + q.orderIndex : q.orderIndex;

  const palette = (s: SectionView, qs: QuestionView[]) => (
    <div className="flex flex-wrap gap-1">
      {qs.map((q) => (
        <a key={q.id} href={`#q-${q.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
          className={cn("flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium ring-amber-400", answers[q.id] ? "bg-brand-600 text-white" : "border border-slate-300 bg-white text-slate-600", flagged.has(q.id) && "ring-2")}
          title={flagged.has(q.id) ? "Review" : undefined}>{num(s, q)}</a>
      ))}
    </div>
  );

  /** Bitta ochiq bo'limning savollari (turiga qarab haqiqiy CBT ko'rinishi). */
  const renderSection = (s: SectionView, st: SectionState) => {
    const groups = groupQuestions(s.questions);
    const gi = Math.min(activeGroup[s.id] ?? 0, groups.length - 1);
    const card = (q: QuestionView, extra: Partial<Parameters<typeof QuestionCard>[0]> = {}) => (
      <QuestionCard key={q.id} q={q} value={answers[q.id]} onChange={(r) => onChange(q.id, r)} attemptId={attempt.id} number={num(s, q)}
        flagged={flagged.has(q.id)} onFlag={() => toggleFlag(q.id)} {...extra} />
    );
    const tabs = (label: string) => groups.length > 1 && (
      <div className="flex flex-wrap gap-2">
        {groups.map((g, i) => {
          const done = g.questions.filter((q) => answers[q.id]).length;
          return (
            <button key={i} type="button" onClick={() => setActiveGroup({ ...activeGroup, [s.id]: i })}
              className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium", i === gi ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
              {label} {i + 1} <span className={cn("ml-1 text-xs", i === gi ? "text-brand-100" : "text-slate-400")}>{done}/{g.questions.length}</span>
            </button>
          );
        })}
      </div>
    );

    if (s.partType === "READING") {
      const g = groups[gi];
      return (
        <div className="space-y-4">
          {tabs("Passage")}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card max-h-[75vh] overflow-y-auto p-6 lg:sticky lg:top-20">
              {g.passage ? <div className="prose prose-slate max-w-none whitespace-pre-wrap text-[15px] leading-relaxed">{g.passage}</div> : <p className="text-sm text-slate-500">Matn yo&apos;q</p>}
            </div>
            <div className="space-y-4">{g.questions.map((q) => card(q, { hidePassage: true }))}</div>
          </div>
        </div>
      );
    }
    if (s.partType === "WRITING") {
      const q = s.questions[gi] ?? s.questions[0];
      return (
        <div className="space-y-4">
          {s.questions.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {s.questions.map((x, i) => (
                <button key={x.id} type="button" onClick={() => setActiveGroup({ ...activeGroup, [s.id]: i })}
                  className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium", i === gi ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
                  Task {i + 1} {answers[x.id]?.text ? "✓" : ""}
                </button>
              ))}
            </div>
          )}
          {q && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card p-6 lg:sticky lg:top-20 lg:self-start">
                <p className="whitespace-pre-line font-medium">{q.prompt}</p>
                {q.passage && <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-700">{q.passage}</pre>}
                {q.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.imageUrl} alt="" className="mt-4 max-h-96 w-full rounded-xl object-contain" onContextMenu={(e) => e.preventDefault()} />
                )}
                {q.minWords != null && <p className="mt-4 text-xs text-slate-500">Write at least {q.minWords} words.</p>}
              </div>
              {card(q, { hidePrompt: true, hidePassage: true })}
            </div>
          )}
        </div>
      );
    }
    if (s.partType === "SPEAKING") {
      const firstOpen = s.questions.findIndex((q) => !answers[q.id]);
      const idx = Math.min(spkIndex[s.id] ?? (firstOpen < 0 ? s.questions.length - 1 : firstOpen), s.questions.length - 1);
      const q = s.questions[idx];
      const answered = !!answers[q.id];
      const last = idx === s.questions.length - 1;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Savol {idx + 1} / {s.questions.length} {q.passage && <span className="ml-2 badge bg-slate-100 text-slate-700">{q.passage.split("-")[0].trim()}</span>}</span>
            <span className="text-xs text-slate-500">Imtihonchi savolni o&apos;qiydi, so&apos;ng javobingiz yoziladi</span>
          </div>
          {card(q, { autoStart: true })}
          {answered && !last && (
            <div className="flex justify-end"><button type="button" onClick={() => setSpkIndex({ ...spkIndex, [s.id]: idx + 1 })} className="btn-primary">Keyingi savol →</button></div>
          )}
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {s.partType === "LISTENING" && s.audioUrl && st.startedAt && (
          <ListeningPlayer src={s.audioUrl} startedAt={st.startedAt} onCheckExpired={() => { if (!free) finishSection(s.id); }} />
        )}
        {s.questions.map((q) => card(q))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 text-white">
        <Link href={`/exams/${exam.id}`} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white"><ChevronLeftIcon width={18} height={18} /><span className="hidden sm:inline">Chiqish</span></Link>
        <span className="h-5 w-px bg-slate-700" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{exam.title}</h1>
          <p className="text-xs text-slate-400">{current ? `${partTypeLabels[current.partType]} · ${current.title}` : "Bo'limlar orasida"}{free && ` · ${totalAnswered}/${totalQuestions} javob`} {saving && "· saqlanmoqda..."}</p>
        </div>
        {timerEnds && <Timer key={free ? "all" : current?.sectionId} expiresAt={timerEnds} onExpire={() => (free ? submitAll() : current && finishSection(current.sectionId))} />}
      </header>

      {/* FREE: fan tablari (DTM) */}
      {free && (
        <div className="sticky top-14 z-20 border-b border-slate-200 bg-white">
          <div className="container-page flex gap-2 overflow-x-auto py-2">
            {states.map((s) => (
              <button key={s.sectionId} type="button" onClick={() => { setActiveSectionId(s.sectionId); window.scrollTo({ top: 0 }); }}
                className={cn("shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium", current?.sectionId === s.sectionId ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
                {s.title} <span className={cn("ml-1 text-xs", current?.sectionId === s.sectionId ? "text-brand-100" : "text-slate-400")}>{answeredIn(s)}/{s.questionCount}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cn("container-page grid flex-1 gap-8 py-6 pb-28", !free && "lg:grid-cols-[1fr_280px]")}>
        <div className="space-y-5">
          {error && <Alert>{error}</Alert>}

          {current && section && (
            <>
              {section.instructions && !free && <Alert type="info" className="whitespace-pre-line text-[13px]">{section.instructions}</Alert>}
              {renderSection(section, current)}
            </>
          )}

          {/* SEQUENTIAL: keyingi bo'lim yo'riqnomasi */}
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
                {next.partType === "SPEAKING" && <p className="mt-4 text-sm text-amber-700">Mikrofon kerak. Brauzer ruxsat so&apos;raganda &quot;Ruxsat berish&quot;ni bosing. Ovozni yoqing: savollar imtihonchi ovozi bilan o&apos;qiladi.</p>}
                {next.partType === "LISTENING" && <p className="mt-4 text-sm text-amber-700">Quloqchin tayyorlang: audio &quot;Boshlash&quot; bosilishi bilan avtomatik ijro etiladi va faqat bir marta eshittiriladi.</p>}
                <p className="mt-4 text-xs text-slate-500">&quot;Boshlash&quot;ni bosganingizdan so&apos;ng {next.durationMinutes} daqiqalik taymer ishga tushadi va to&apos;xtatib bo&apos;lmaydi.</p>
                <button onClick={() => startSection(next.sectionId)} disabled={busy} className="btn-primary btn-lg mt-6">{busy ? "..." : `${next.title} bo'limini boshlash`}</button>
              </div>
            );
          })()}

          {allDone && (
            <div className="card mx-auto max-w-2xl p-8 text-center">
              <h2 className="text-2xl font-bold">Barcha bo&apos;limlar yakunlandi</h2>
              <button onClick={submitAll} className="btn-primary btn-lg mt-6">Natijani ko&apos;rish</button>
            </div>
          )}
        </div>

        {!free && (
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
            </div>
          </aside>
        )}
      </div>

      {/* Pastki navigatsiya paneli (CBT'dagidek): savol raqamlari, Review belgilari, yakunlash */}
      {current && section && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="container-page flex flex-wrap items-center gap-3 py-2">
            <div className="max-h-20 min-w-0 flex-1 overflow-y-auto">{palette(section, section.questions)}</div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block h-3 w-3 rounded-sm bg-brand-600" /> javob berilgan
              <span className="ml-2 inline-block h-3 w-3 rounded-sm border border-slate-300 ring-2 ring-amber-400" /> review
            </div>
            {confirming ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600">
                  {free
                    ? `${totalQuestions - totalAnswered} ta savol javobsiz. Imtihonni topshirasizmi?`
                    : `${answeredIn(current) < current.questionCount ? `${current.questionCount - answeredIn(current)} ta savol javobsiz. ` : ""}Bo'limni yakunlaysizmi? Qaytib bo'lmaydi.`}
                </span>
                <button onClick={() => setConfirming(false)} disabled={busy} className="btn-secondary btn-sm">Bekor</button>
                <button onClick={() => (free ? submitAll() : finishSection(current.sectionId))} disabled={busy} className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700">{busy ? "..." : free ? "Ha, topshirish" : next ? "Ha, keyingi bo'limga" : "Ha, topshirish"}</button>
              </div>
            ) : (
              <button onClick={() => setConfirming(true)} className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700">{free ? "Imtihonni topshirish" : next ? "Bo'limni yakunlash →" : "Imtihonni topshirish"}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
