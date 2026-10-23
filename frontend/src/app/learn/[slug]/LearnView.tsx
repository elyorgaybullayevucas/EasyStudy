"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { QuizRunner } from "@/components/course/QuizRunner";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { Alert } from "@/components/ui/Alert";
import { AwardIcon, CheckIcon, ChevronLeftIcon, LockIcon, MenuIcon, PlayIcon, QuizIcon, TimerIcon, XIcon } from "@/components/ui/Icons";
import { MathText } from "@/components/ui/MathText";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PageLoader, Spinner } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/format";
import type { CourseDetail, CourseProgress, Lesson, LessonBrief, ModuleBrief, QuizBrief } from "@/lib/types";

/**
 * O'quv rejimi (onlayn maktab): bo'limlar -> darslar -> dars testi -> bo'lim mock'i -> yakuniy imtihon.
 * Ketma-ket rejimda keyingi dars oldingi dars va uning testi bajarilgach ochiladi.
 */
export function LearnView({ slug }: { slug: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const lessonParam = Number(params.get("lesson")) || null;
  const quizParam = Number(params.get("quiz")) || null;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [lessonState, setLessonState] = useState<{ id: number; lesson: Lesson | null; error: string } | null>(null);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const canAccessAll = !!progress?.enrolled || (!!user && !!course && (user.role === "ADMIN" || course.instructor?.id === user.id));

  const refreshProgress = useCallback(() => {
    if (!user) return;
    api.courses.progress(slug).then(setProgress).catch(() => undefined);
  }, [slug, user]);

  useEffect(() => {
    if (authLoading) return;
    Promise.all([api.courses.get(slug), user ? api.courses.progress(slug).catch(() => null) : Promise.resolve(null)])
      .then(([c, p]) => { setCourse(c); setProgress(p); })
      .catch((e) => setPageError(e instanceof ApiError ? e.message : "Kursni yuklab bo'lmadi"));
  }, [slug, user, authLoading]);

  const activeLessonId = quizParam !== null ? null : (lessonParam ?? progress?.nextLessonId ?? course?.lessons[0]?.id ?? null);

  useEffect(() => {
    if (!course || activeLessonId === null) return;
    api.courses.lesson(slug, activeLessonId)
      .then((lesson) => setLessonState({ id: activeLessonId, lesson, error: "" }))
      .catch((e) => setLessonState({ id: activeLessonId, lesson: null, error: e instanceof ApiError ? e.message : "Darsni yuklab bo'lmadi" }));
  }, [course, slug, activeLessonId, progress?.enrolled, progress?.unlockedLessonIds?.length]);

  const current = lessonState?.id === activeLessonId ? lessonState : null;
  const lesson = current?.lesson ?? null;
  const lessonError = current?.error ?? "";

  const go = (query: string) => {
    setSidebarOpen(false);
    router.push(`/learn/${slug}?${query}`, { scroll: false });
    window.scrollTo({ top: 0 });
  };

  if (pageError) {
    return (
      <div className="container-page py-20">
        <Alert>{pageError}</Alert>
        <Link href="/courses" className="btn-secondary mt-4">Kurslarga qaytish</Link>
      </div>
    );
  }
  if (!course || authLoading) return <PageLoader />;

  const completed = new Set(progress?.completedLessonIds ?? []);
  const unlocked = new Set(progress?.unlockedLessonIds ?? (course.sequential ? [] : course.lessons.map((l) => l.id)));
  const isUnlocked = (l: LessonBrief) => !course.sequential || !progress || unlocked.has(l.id) || (!!user && (user.role === "ADMIN" || course.instructor?.id === user.id));
  const lessonIndex = course.lessons.findIndex((l) => l.id === activeLessonId);
  const nextLesson = lessonIndex >= 0 ? course.lessons[lessonIndex + 1] : undefined;
  const quizOfLesson = (id: number) => course.quizzes.find((q) => q.lessonId === id);
  const generalQuizzes = course.quizzes.filter((q) => q.lessonId == null);
  const quizProg = (q: QuizBrief) => progress?.quizzes.find((x) => x.quizId === q.id);
  const moduleOf = (l: LessonBrief | null) => (l ? course.modules.find((m) => m.id === l.moduleId) ?? null : null);
  const moduleProg = (m: ModuleBrief) => progress?.modules.find((x) => x.moduleId === m.id);
  const lastInModule = (l: LessonBrief) => { const m = moduleOf(l); return !!m && m.lessonIds[m.lessonIds.length - 1] === l.id; };

  // Sidebar guruhlari: bo'limlar (modullar) + bo'limsiz darslar
  const groups: { module: ModuleBrief | null; lessons: LessonBrief[] }[] = [
    ...course.modules.map((m) => ({ module: m, lessons: course.lessons.filter((l) => l.moduleId === m.id) })),
  ];
  const orphan = course.lessons.filter((l) => !l.moduleId || !course.modules.some((m) => m.id === l.moduleId));
  if (orphan.length) groups.push({ module: null, lessons: orphan });

  const toggleComplete = async () => {
    if (!lesson) return;
    setSaving(true);
    try {
      const updated = completed.has(lesson.id) ? await api.learning.uncompleteLesson(lesson.id) : await api.learning.completeLesson(lesson.id);
      setProgress(updated);
      if (!completed.has(lesson.id)) {
        const q = quizOfLesson(lesson.id);
        if (q && !quizProg(q)?.passed) go(`quiz=${q.id}`);
        else if (nextLesson) go(`lesson=${nextLesson.id}`);
      }
    } catch (e) {
      setPageError(e instanceof ApiError ? e.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const enroll = async () => {
    if (!user) return router.push(`/login?next=${encodeURIComponent(`/learn/${slug}`)}`);
    try { setProgress(await api.courses.enroll(slug)); } catch (e) { setPageError(e instanceof ApiError ? e.message : "Yozilib bo'lmadi"); }
  };

  const activeQuiz = quizParam !== null ? course.quizzes.find((q) => q.id === quizParam) : null;
  const activeModule = moduleOf(lesson);
  const activeModuleProg = activeModule ? moduleProg(activeModule) : undefined;
  const lessonQuiz = lesson ? quizOfLesson(lesson.id) : undefined;
  const lessonQuizProg = lessonQuiz ? quizProg(lessonQuiz) : undefined;
  const numberOf = (id: number) => course.lessons.findIndex((l) => l.id === id) + 1;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 text-white">
        <Link href={`/courses/${slug}`} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white">
          <ChevronLeftIcon width={18} height={18} /><span className="hidden sm:inline">Kursga qaytish</span>
        </Link>
        <span className="h-5 w-px bg-slate-700" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{course.title}</h1>
          {course.stage != null && <p className="text-xs text-slate-400">{course.category?.name} · {course.stage}-bosqich</p>}
        </div>
        {progress?.enrolled && (
          <div className="hidden w-48 items-center gap-2 sm:flex">
            <ProgressBar value={progress.progressPercent} className="bg-slate-700" />
            <span className="text-xs text-slate-300">{progress.progressPercent}%</span>
          </div>
        )}
        {progress?.certificateCode && (
          <Link href={`/certificates/${progress.certificateCode}`} className="hidden items-center gap-1 text-sm text-accent-400 md:flex"><AwardIcon width={16} height={16} /> Sertifikat</Link>
        )}
        <button className="lg:hidden" onClick={() => setSidebarOpen((v) => !v)} aria-label="Darslar ro'yxati">{sidebarOpen ? <XIcon /> : <MenuIcon />}</button>
      </header>

      <div className="flex flex-1">
        <main className="min-w-0 flex-1">
          {quizParam !== null ? (
            <div className="px-4 py-8 sm:px-8">
              {canAccessAll ? (
                <>
                  <QuizRunner key={quizParam} quizId={quizParam} onSubmitted={refreshProgress} />
                  {activeQuiz?.lessonId && (() => {
                    const idx = course.lessons.findIndex((l) => l.id === activeQuiz.lessonId);
                    const nl = course.lessons[idx + 1];
                    const passed = quizProg(activeQuiz)?.passed;
                    return (
                      <div className="mx-auto mt-8 flex max-w-3xl justify-between border-t border-slate-100 pt-6">
                        <button onClick={() => go(`lesson=${activeQuiz.lessonId}`)} className="btn-secondary">Darsga qaytish</button>
                        {nl && <button onClick={() => go(`lesson=${nl.id}`)} disabled={course.sequential && !passed} className="btn-primary" title={course.sequential && !passed ? "Keyingi dars testdan o'tgach ochiladi" : undefined}>Keyingi dars →</button>}
                      </div>
                    );
                  })()}
                </>
              ) : <LockedNotice onEnroll={enroll} />}
            </div>
          ) : (
            <>
              {(lesson?.videoUrl || !lesson) && (
                <div className="bg-black">
                  <div className="mx-auto max-w-5xl">
                    {lesson ? <VideoPlayer url={lesson.videoUrl} title={lesson.title} source={lesson.videoSource} watermark={user?.email} />
                      : lessonError ? <div className="flex aspect-video items-center justify-center text-slate-400"><LockIcon width={40} height={40} /></div>
                      : <div className="flex aspect-video items-center justify-center"><Spinner /></div>}
                  </div>
                </div>
              )}
              <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
                {lessonError ? <LockedNotice message={lessonError} onEnroll={enroll} locked={lessonError.includes("ochilmagan")} /> : lesson ? (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{activeModule ? `${activeModule.title} · ` : ""}{lessonIndex + 1}-dars / {course.lessons.length}</p>
                        <h2 className="mt-1 text-2xl font-bold">{lesson.title}</h2>
                      </div>
                      {progress?.enrolled && (
                        <button onClick={toggleComplete} disabled={saving} className={completed.has(lesson.id) ? "btn-secondary" : "btn-primary"}>
                          <CheckIcon width={16} height={16} />{completed.has(lesson.id) ? "Tugallangan" : "Darsni tugatdim"}
                        </button>
                      )}
                    </div>
                    {lesson.content && <MathText text={lesson.content} className="mt-6" />}

                    {/* Dars testi */}
                    {lessonQuiz && canAccessAll && (
                      <div className={cn("mt-6 flex flex-wrap items-center gap-4 rounded-2xl border p-5", lessonQuizProg?.passed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                        <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", lessonQuizProg?.passed ? "bg-emerald-500 text-white" : "bg-amber-200 text-amber-800")}>{lessonQuizProg?.passed ? <CheckIcon width={18} height={18} strokeWidth={3} /> : <QuizIcon width={18} height={18} />}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">Mavzu testi</p>
                          <p className="font-semibold">{lessonQuiz.title}</p>
                          <p className="text-xs text-slate-600">{lessonQuiz.questionCount} savol · o&apos;tish {lessonQuiz.passScore}%{lessonQuizProg?.bestScore != null ? ` · eng yaxshi natija ${lessonQuizProg.bestScore}%` : ""}{course.sequential && !lessonQuizProg?.passed ? " · keyingi dars testdan o'tgach ochiladi" : ""}</p>
                        </div>
                        <button onClick={() => go(`quiz=${lessonQuiz.id}`)} className={lessonQuizProg?.passed ? "btn-secondary" : "btn-primary"}>{lessonQuizProg?.passed ? "Qayta topshirish" : "Testni topshirish"}</button>
                      </div>
                    )}
                    {lesson.exam && (
                      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                        <div className="flex-1">
                          <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">Mavzu bo&apos;yicha mock</p>
                          <p className="mt-1 font-semibold">{lesson.exam.title}</p>
                          <p className="text-xs text-slate-600">{lesson.exam.totalMinutes} daqiqa · {lesson.exam.questionCount} savol · natija darhol</p>
                        </div>
                        <Link href={`/exams/${lesson.exam.id}`} className="btn-primary">Mock&apos;ni topshirish</Link>
                      </div>
                    )}
                    {/* Bo'lim mock'i (bo'limning oxirgi darsida) */}
                    {activeModule?.exam && lastInModule(lesson) && (
                      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white"><TimerIcon width={18} height={18} /></span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold tracking-wider text-violet-700 uppercase">Bo&apos;lim yakuni: mock imtihon</p>
                          <p className="mt-1 font-semibold">{activeModule.exam.title}</p>
                          <p className="text-xs text-slate-600">{activeModule.exam.totalMinutes} daqiqa · {activeModule.exam.questionCount} savol
                            {activeModuleProg?.examAttempts ? ` · eng yaxshi: ${activeModuleProg.examBestRaw ?? "-"} ball${activeModuleProg.examBestLabel ? ` (${activeModuleProg.examBestLabel})` : ""}` : ""}</p>
                        </div>
                        <Link href={`/exams/${activeModule.exam.id}`} className="btn bg-violet-600 text-white hover:bg-violet-700">Mock&apos;ni topshirish</Link>
                      </div>
                    )}
                    {!nextLesson && course.finalExam && (
                      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex-1">
                          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">{course.stage != null ? "Bosqich yakuni" : "Kurs yakuni"}: imtihon</p>
                          <p className="mt-1 font-semibold">{course.finalExam.title}</p>
                          <p className="text-xs text-slate-600">{course.finalExam.totalMinutes} daqiqa · {course.finalExam.questionCount} savol / vazifa · haqiqiy format</p>
                        </div>
                        <Link href={`/exams/${course.finalExam.id}`} className="btn bg-emerald-600 text-white hover:bg-emerald-700">Imtihonni boshlash</Link>
                      </div>
                    )}
                    {progress?.completed && progress.nextStage && (
                      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-300 bg-brand-50 p-5">
                        <div className="flex-1">
                          <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">Tabriklaymiz, bosqich tugadi</p>
                          <p className="mt-1 font-semibold">Keyingi: {progress.nextStage.title}</p>
                        </div>
                        <Link href={`/courses/${progress.nextStage.slug}`} className="btn-primary">{progress.nextStage.stage}-bosqichga o&apos;tish</Link>
                      </div>
                    )}
                    {!progress?.enrolled && (
                      <Alert type="info" className="mt-6">Bu bepul tanishuv darsi. Barcha darslar, testlar va sertifikat uchun <button onClick={enroll} className="font-semibold underline">kursga yoziling</button>.</Alert>
                    )}
                    <div className="mt-8 flex justify-between border-t border-slate-100 pt-6">
                      {lessonIndex > 0 ? <button onClick={() => go(`lesson=${course.lessons[lessonIndex - 1].id}`)} className="btn-secondary">Oldingi dars</button> : <span />}
                      {nextLesson ? (
                        <button onClick={() => go(`lesson=${nextLesson.id}`)} disabled={!isUnlocked(nextLesson)} className="btn-secondary" title={!isUnlocked(nextLesson) ? "Avval shu darsni tugating va testini topshiring" : undefined}>
                          {!isUnlocked(nextLesson) && <LockIcon width={14} height={14} />} Keyingi dars
                        </button>
                      ) : generalQuizzes[0] ? <button onClick={() => go(`quiz=${generalQuizzes[0].id}`)} className="btn-secondary">Yakuniy testga o&apos;tish</button> : null}
                    </div>
                  </>
                ) : null}
              </div>
            </>
          )}
        </main>

        <aside className={cn("fixed inset-y-14 right-0 z-20 w-80 overflow-y-auto border-l border-slate-200 bg-white transition-transform lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0",
          sidebarOpen ? "translate-x-0 shadow-xl" : "translate-x-full")}>
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-semibold">Kurs mazmuni</h2>
            {progress?.enrolled ? <p className="mt-1 text-xs text-slate-500">{completed.size} / {course.lessons.length} dars tugallandi{course.sequential ? " · ketma-ket rejim" : ""}</p>
              : <button onClick={enroll} className="btn-primary mt-3 w-full">Kursga yozilish</button>}
          </div>
          {groups.map((g, gi) => {
            const mp = g.module ? moduleProg(g.module) : undefined;
            return (
              <div key={g.module?.id ?? `g${gi}`}>
                {g.module && (
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
                    <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">{g.module.position}-bo&apos;lim</p>
                    <p className="text-sm font-semibold">{g.module.title}</p>
                    {mp && <p className="text-[11px] text-slate-500">{mp.completedLessons}/{mp.totalLessons} dars{g.module.exam ? (mp.examAttempts ? ` · mock: ${mp.examBestRaw ?? "-"}` : " · mock topshirilmagan") : ""}</p>}
                  </div>
                )}
                <ul>
                  {g.lessons.map((l) => {
                    const active = l.id === activeLessonId;
                    const locked = (!canAccessAll && !l.preview) || !isUnlocked(l);
                    const q = quizOfLesson(l.id);
                    const qp = q ? quizProg(q) : undefined;
                    return (
                      <li key={l.id}>
                        <button onClick={() => go(`lesson=${l.id}`)} disabled={!isUnlocked(l)} className={cn("flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60", active && "bg-brand-50")}>
                          <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]", completed.has(l.id) ? "border-accent-500 bg-accent-500 text-white" : "border-slate-300 text-slate-500")}>
                            {completed.has(l.id) ? <CheckIcon width={12} height={12} strokeWidth={3} /> : numberOf(l.id)}
                          </span>
                          <span className="flex-1">
                            <span className={cn("block", active && "font-semibold text-brand-800")}>{l.title}</span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><PlayIcon width={11} height={11} /> {l.durationMinutes} daq</span>
                              {q && <span className={cn("flex items-center gap-1", qp?.passed ? "text-emerald-600" : "")}><QuizIcon width={11} height={11} /> {qp?.passed ? "test ✓" : qp?.bestScore != null ? `test ${qp.bestScore}%` : "test"}</span>}
                            </span>
                          </span>
                          {locked && <LockIcon width={14} height={14} className="mt-1 text-slate-400" />}
                        </button>
                      </li>
                    );
                  })}
                  {g.module?.exam && (
                    <li>
                      <Link href={`/exams/${g.module.exam.id}`} className="flex w-full items-start gap-3 border-b border-slate-100 bg-violet-50/50 px-4 py-3 text-left text-sm hover:bg-violet-50">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white"><TimerIcon width={11} height={11} /></span>
                        <span className="flex-1">
                          <span className="block font-medium">Bo&apos;lim mock&apos;i</span>
                          <span className="text-xs text-slate-500">{mp?.examAttempts ? `eng yaxshi: ${mp.examBestRaw ?? "-"} ball${mp.examBestLabel ? ` · ${mp.examBestLabel}` : ""}` : `${g.module.exam.questionCount} savol · ${g.module.exam.totalMinutes} daqiqa`}</span>
                        </span>
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
          {generalQuizzes.length > 0 && (
            <ul>
              {generalQuizzes.map((q) => {
                const qp = quizProg(q);
                return (
                  <li key={`q-${q.id}`}>
                    <button onClick={() => go(`quiz=${q.id}`)} className={cn("flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50", quizParam === q.id && "bg-brand-50")}>
                      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", qp?.passed ? "bg-accent-500 text-white" : "bg-amber-100 text-amber-700")}>
                        {qp?.passed ? <CheckIcon width={12} height={12} strokeWidth={3} /> : <QuizIcon width={12} height={12} />}
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">{q.title}</span>
                        <span className="text-xs text-slate-500">{qp?.bestScore != null ? `Eng yaxshi natija: ${qp.bestScore}%` : `${q.questionCount} ta savol`}</span>
                      </span>
                      {!canAccessAll && <LockIcon width={14} height={14} className="mt-1 text-slate-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {course.finalExam && (
            <Link href={`/exams/${course.finalExam.id}`} className="flex items-start gap-3 border-b border-slate-100 bg-emerald-50/60 px-4 py-3 text-sm hover:bg-emerald-50">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><AwardIcon width={11} height={11} /></span>
              <span className="flex-1"><span className="block font-medium">Yakuniy imtihon</span><span className="text-xs text-slate-500">{course.finalExam.title}</span></span>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

function LockedNotice({ message, onEnroll, locked }: { message?: string; onEnroll: () => void; locked?: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500"><LockIcon /></span>
      <h2 className="mt-4 text-lg font-semibold">{locked ? "Bu dars hali ochilmagan" : "Bu kontent yopiq"}</h2>
      <p className="mt-2 text-sm text-slate-600">{message ?? "Testni topshirish uchun kursga yoziling."}</p>
      {!locked && <button onClick={onEnroll} className="btn-primary mt-6">Kursga yozilish</button>}
    </div>
  );
}
