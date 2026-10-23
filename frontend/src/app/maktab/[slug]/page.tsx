"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { CategoryIcon, CheckIcon, LockIcon, TimerIcon } from "@/components/ui/Icons";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn, formatDate, levelLabels } from "@/lib/format";
import type { Subject } from "@/lib/types";

/** Fan sahifasi: daraja testi -> tavsiya etilgan bosqich -> bosqichlar ro'yxati (ochiq / qulf), sertifikat yo'llari. */
export default function SubjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading } = useAuth();
  const [s, setS] = useState<Subject | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    api.subjects.get(slug).then(setS).catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [slug, loading, user]);

  if (error) return <div className="container-page py-10"><Alert>{error}</Alert></div>;
  if (!s) return <PageLoader />;

  const my = s.myPlacement;
  const completed = new Set(s.completedCourseIds);
  const enrolled = new Set(s.enrolledCourseIds);
  const stageOpen = (stage: number | null) => {
    if (stage == null || stage <= 1) return true;
    if (my && my.stage >= stage) return true;
    const prev = s.stages.find((c) => c.stage === stage - 1);
    return !!prev && completed.has(prev.id);
  };

  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="container-page py-12">
          <Link href="/maktab" className="text-sm text-slate-400 hover:text-white">← Onlayn maktab</Link>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-brand-200"><CategoryIcon icon={s.icon} width={28} height={28} /></span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{s.name}</h1>
              <p className="text-sm text-slate-300">{s.stages.length} bosqich · {s.examCount} mock imtihon</p>
            </div>
          </div>
          {s.description && <p className="mt-4 max-w-2xl text-slate-300">{s.description}</p>}
          {s.certifications.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-400">Tayyorlaydi:</span>
              {s.certifications.map((c) => <Link key={c.id} href={`/exams?category=${c.slug}`} className="badge bg-white/10 text-white hover:bg-white/20">{c.name} mock&apos;lari</Link>)}
            </div>
          )}
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-xl font-bold">Bosqichlar</h2>
          <p className="mt-1 text-sm text-slate-500">Daraja testi natijasiga ko&apos;ra mos bosqich ochiladi; har bosqich yakuniy imtihon bilan tugaydi va keyingisini ochadi.</p>
          <ol className="mt-5 space-y-4">
            {s.stages.map((c) => {
              const open = stageOpen(c.stage);
              const done = completed.has(c.id);
              const recommended = my && my.stage === c.stage;
              return (
                <li key={c.id} className={cn("card p-5", recommended && "border-brand-400 ring-2 ring-brand-100", !open && "opacity-80")}>
                  <div className="flex flex-wrap items-start gap-4">
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold", done ? "bg-emerald-500 text-white" : open ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500")}>
                      {done ? <CheckIcon width={16} height={16} strokeWidth={3} /> : !open ? <LockIcon width={14} height={14} /> : c.stage ?? "•"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{c.title}</h3>
                        <span className="badge bg-slate-100 text-slate-600">{levelLabels[c.level]}</span>
                        {recommended && <span className="badge bg-brand-600 text-white">Sizga tavsiya</span>}
                        {done && <span className="badge bg-emerald-50 text-emerald-700">tugatilgan</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{c.shortDescription}</p>
                      <p className="mt-2 text-xs text-slate-500">{c.lessonCount} dars · {c.studentCount} talaba{c.minPlacementScore > 0 ? ` · daraja testidan ${c.minPlacementScore}%+` : ""}{c.sequential ? " · darslar ketma-ket ochiladi" : ""}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {open ? (
                        <Link href={enrolled.has(c.id) ? `/learn/${c.slug}` : `/courses/${c.slug}`} className="btn-primary">{enrolled.has(c.id) ? "Davom etish" : "Boshlash"}</Link>
                      ) : (
                        <span className="btn-secondary cursor-not-allowed text-slate-400"><LockIcon width={14} height={14} /> Yopiq</span>
                      )}
                      <Link href={`/courses/${c.slug}`} className="btn-ghost text-xs">Batafsil</Link>
                    </div>
                  </div>
                  {!open && <p className="mt-3 text-xs text-amber-700">Ochish uchun: oldingi bosqichni tugating yoki daraja testida {c.minPlacementScore}%+ oling.</p>}
                </li>
              );
            })}
            {s.stages.length === 0 && <p className="text-sm text-slate-500">Bu fan bo&apos;yicha bosqichlar hali joylanmagan.</p>}
          </ol>
        </div>

        <aside className="space-y-4">
          <div className="card p-6">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Darajani aniqlash</p>
            {my ? (
              <>
                <p className="mt-2 text-3xl font-bold">{my.scorePercent}%</p>
                <p className="text-sm text-slate-600">Tavsiya: <b>{my.stage}-bosqich</b>{my.courseTitle ? ` — ${my.courseTitle}` : ""}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(my.createdAt)}</p>
                {my.courseSlug && <Link href={enrolled.has(s.stages.find((c) => c.slug === my.courseSlug)?.id ?? -1) ? `/learn/${my.courseSlug}` : `/courses/${my.courseSlug}`} className="btn-primary mt-4 w-full">Bosqichni boshlash</Link>}
                {s.placementExam && <Link href={`/exams/${s.placementExam.id}`} className="btn-ghost mt-2 w-full text-xs">Testni qayta topshirish</Link>}
              </>
            ) : s.placementExam ? (
              <>
                <p className="mt-2 text-sm text-slate-600">{s.placementExam.questionCount} savol · {s.placementExam.totalMinutes} daqiqa. Natijaga ko&apos;ra qaysi bosqichdan boshlashingiz belgilanadi.</p>
                <Link href={user ? `/exams/${s.placementExam.id}` : `/login?next=/maktab/${s.slug}`} className="btn-primary mt-4 w-full"><TimerIcon width={16} height={16} /> Daraja testini topshirish</Link>
                <p className="mt-2 text-xs text-slate-500">Testsiz ham 1-bosqichdan boshlashingiz mumkin.</p>
              </>
            ) : <p className="mt-2 text-sm text-slate-600">Bu fan uchun daraja testi hali qo&apos;shilmagan — 1-bosqichdan boshlang.</p>}
          </div>
          {s.certifications.length > 0 && (
            <div className="card p-6">
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Sertifikat imtihonlari</p>
              <ul className="mt-3 space-y-2 text-sm">
                {s.certifications.map((c) => <li key={c.id}><Link href={`/exams?category=${c.slug}`} className="text-brand-700 hover:underline">{c.name} — haqiqiy formatdagi mock&apos;lar</Link></li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
