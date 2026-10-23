"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn, formatDate, ieltsCefr, partTypeLabels, statusLabels } from "@/lib/format";
import type { AttemptResult, SectionResult } from "@/lib/types";

const scoreTitle = { TOTAL: "Umumiy ball", SECTION_AVERAGE: "Umumiy band", SECTION_SUM: "Umumiy ball" };
const fmt = (n: number | null | undefined, digits = 1) => (n == null ? "—" : Number(n).toFixed(digits).replace(/\.0$/, ""));

/** IELTS Test Report Form ko'rinishi: 4 ko'nikma bandi + Overall + CEFR. */
function IeltsReport({ res }: { res: AttemptResult }) {
  const by = (p: string) => res.sections.find((s) => s.partType === p);
  const skills: [string, SectionResult | undefined][] = [["Listening", by("LISTENING")], ["Reading", by("READING")], ["Writing", by("WRITING")], ["Speaking", by("SPEAKING")]];
  const overall = res.scaledScore;
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
        <div>
          <p className="text-xs tracking-wider text-slate-300 uppercase">Test Report Form · mock</p>
          <p className="font-semibold">{res.examTitle}</p>
        </div>
        <div className="text-right text-xs text-slate-300">
          <p>Candidate: <span className="font-medium text-white">{res.studentName}</span></p>
          <p>Date: {res.submittedAt ? formatDate(res.submittedAt) : "—"}</p>
        </div>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {skills.map(([name, s]) => (
            <div key={name} className="rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{name}</p>
              <p className="mt-1 text-3xl font-bold">{s?.pending ? <span className="text-base text-amber-600">…</span> : fmt(s?.scaledScore)}</p>
              {s && (s.partType === "LISTENING" || s.partType === "READING") && <p className="mt-1 text-xs text-slate-500">{s.correctCount} / {s.questionCount} to&apos;g&apos;ri</p>}
              {s?.pending && <p className="mt-1 text-[11px] text-amber-600">baholanmoqda</p>}
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-indigo-700 px-8 py-4 text-white">
          <p className="text-xs tracking-wider text-brand-100 uppercase">Overall Band Score</p>
          <p className="text-5xl font-bold">{overall != null ? fmt(overall) : "…"}</p>
          {overall != null && <p className="mt-1 text-sm font-semibold text-accent-400">CEFR {ieltsCefr(overall)}</p>}
        </div>
      </div>
      <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
        Umumiy band = 4 ko&apos;nikma o&apos;rtachasi (.25 → .5, .75 → keyingi butun). Listening/Reading: rasmiy 40 savollik jadval. Writing: (Task 1 + 2 × Task 2) / 3. Rasmiy IELTS bandlari bilan to&apos;g&apos;ridan-to&apos;g&apos;ri taqqoslanadi.
      </p>
    </div>
  );
}

/** DTM natija varaqasi: har fan bo'yicha to'g'ri javoblar, koeffitsient, ball; jami. */
function DtmSheet({ res }: { res: AttemptResult }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
        <div>
          <p className="text-xs tracking-wider text-slate-300 uppercase">Test natijalari varaqasi · mock</p>
          <p className="font-semibold">{res.examTitle}</p>
        </div>
        <div className="text-right text-xs text-slate-300">
          <p>Abituriyent: <span className="font-medium text-white">{res.studentName}</span></p>
          <p>Sana: {res.submittedAt ? formatDate(res.submittedAt) : "—"}</p>
        </div>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
          <tr><th className="px-5 py-3">Fan</th><th className="px-3 py-3 text-center">Savollar</th><th className="px-3 py-3 text-center">To&apos;g&apos;ri</th><th className="px-3 py-3 text-center">Koeffitsient</th><th className="px-5 py-3 text-right">Ball</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {res.sections.map((s) => (
            <tr key={s.sectionId}>
              <td className="px-5 py-3 font-medium">{s.title}</td>
              <td className="px-3 py-3 text-center">{s.questionCount}</td>
              <td className="px-3 py-3 text-center">{s.correctCount}</td>
              <td className="px-3 py-3 text-center text-slate-600">× {fmt(s.pointsPerQuestion, 1)}</td>
              <td className="px-5 py-3 text-right font-semibold">{fmt(s.rawScore, 1)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 bg-slate-50">
            <td className="px-5 py-3 font-bold" colSpan={2}>Jami</td>
            <td className="px-3 py-3 text-center font-semibold">{res.sections.reduce((n, s) => n + s.correctCount, 0)} / {res.sections.reduce((n, s) => n + s.questionCount, 0)}</td>
            <td />
            <td className="px-5 py-3 text-right text-xl font-bold">{fmt(res.rawScore, 1)} <span className="text-sm font-normal text-slate-500">/ {fmt(res.maxScore, 1)}</span></td>
          </tr>
        </tfoot>
      </table>
      {res.label && <p className="border-t border-slate-100 px-6 py-3 text-sm font-semibold text-brand-700">{res.label}</p>}
      <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">Rasmiy DTM tizimi: majburiy fanlar 1.1, 1-mutaxassislik 3.1, 2-mutaxassislik 2.1 ball; noto&apos;g&apos;ri javob uchun ball ayirilmaydi. Maks 189 ball.</p>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [res, setRes] = useState<AttemptResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return router.push(`/login?next=/attempts/${id}/result`);
    api.attempts.result(id).then(setRes).catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [id, user, loading, router]);

  // AI baholash tugashini kutish: har 4 soniyada yangilash
  useEffect(() => {
    if (!res || res.aiStatus !== "PENDING") return;
    const t = setInterval(() => api.attempts.result(id).then(setRes).catch(() => undefined), 4000);
    return () => clearInterval(t);
  }, [res, id]);

  if (error) return <div className="container-page py-10"><Alert>{error}</Alert></div>;
  if (!res) return <PageLoader />;

  const ielts = !!res.templateCode?.startsWith("IELTS");
  const dtm = res.templateCode === "DTM" || res.templateCode === "DTM_SUBJECT";
  const auto = res.answers.filter((a) => a.type !== "ESSAY" && a.type !== "SPEAKING");
  const correct = auto.filter((a) => a.correct === true).length;
  // Ketma-ket raqamlash (DTM: 1-90; IELTS: bo'lim ichida 1-40)
  const offsets: Record<number, number> = {};
  let n = 0;
  for (const s of res.sections) { offsets[s.sectionId] = dtm ? n : 0; n += s.questionCount; }
  const idxInSection: Record<number, number> = {};
  const numbered = res.answers.map((a) => { idxInSection[a.sectionId] = (idxInSection[a.sectionId] ?? 0) + 1; return { a, no: offsets[a.sectionId] + idxInSection[a.sectionId] }; });

  return (
    <div className="container-page max-w-4xl py-10">
      <p className="text-sm text-slate-500">Mock imtihon natijasi · {statusLabels[res.status]}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{res.examTitle}</h1>

      {res.placement && (
        <div className="mt-6 rounded-2xl border border-brand-300 bg-brand-50 p-6">
          <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">Darajangiz aniqlandi · {res.placement.categoryName}</p>
          <p className="mt-1 text-2xl font-bold">{res.placement.scorePercent}% → {res.placement.stage}-bosqichdan boshlang</p>
          {res.placement.courseTitle && <p className="mt-1 text-sm text-slate-700">{res.placement.courseTitle}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {res.placement.courseSlug && <Link href={`/courses/${res.placement.courseSlug}`} className="btn-primary">Bosqichni boshlash</Link>}
            <Link href={`/maktab/${res.placement.categorySlug}`} className="btn-secondary">Fan sahifasi</Link>
          </div>
        </div>
      )}
      {res.pendingCount > 0 && res.aiStatus === "PENDING" && (
        <Alert type="info" className="mt-6">Writing/Speaking javoblaringiz AI tomonidan baholanmoqda (odatda 1 daqiqagacha). Natija avtomatik yangilanadi.</Alert>
      )}
      {res.pendingCount > 0 && res.aiStatus !== "PENDING" && (
        <Alert type="info" className="mt-6">{res.pendingCount} ta Writing/Speaking javobi o&apos;qituvchi tomonidan tekshirilmoqda. Yakuniy natija tekshiruvdan so&apos;ng shu sahifada chiqadi.</Alert>
      )}
      {res.pendingCount === 0 && res.answers.some((a) => a.aiGraded) && (
        <Alert type="success" className="mt-6">Writing/Speaking javoblari AI tomonidan rasmiy mezonlar bo&apos;yicha baholandi; o&apos;qituvchi keyinroq ko&apos;rib ballni aniqlashtirishi mumkin.</Alert>
      )}

      <div className="mt-8">
        {ielts ? <IeltsReport res={res} /> : dtm ? <DtmSheet res={res} /> : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card bg-gradient-to-br from-brand-700 to-indigo-700 p-5 text-white">
              <p className="text-xs text-brand-100">{scoreTitle[res.scoringMode]}</p>
              <p className="text-4xl font-bold">{res.scaledScore ?? (res.pendingCount > 0 ? "…" : "—")}</p>
              {res.label && <p className="mt-1 text-sm font-semibold text-accent-400">{res.label}</p>}
            </div>
            <div className="card p-5"><p className="text-xs text-slate-500">Avtomatik tekshirilgan</p><p className="text-2xl font-bold">{correct} / {auto.length}</p><p className="text-xs text-slate-500">to&apos;g&apos;ri javob</p></div>
            <div className="card p-5"><p className="text-xs text-slate-500">Xom ball</p><p className="text-2xl font-bold">{res.rawScore ?? 0} / {res.maxScore}</p></div>
          </div>
        )}
      </div>

      {!dtm && (
        <>
          <h2 className="mt-10 text-lg font-bold">Bo&apos;limlar bo&apos;yicha</h2>
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
                <tr><th className="px-4 py-3">Bo&apos;lim</th><th className="px-4 py-3">Tur</th><th className="px-4 py-3">To&apos;g&apos;ri javoblar / vazifa bandlari</th><th className="px-4 py-3">Band / shkala</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {res.sections.map((s) => (
                  <tr key={s.sectionId}>
                    <td className="px-4 py-3 font-medium">{s.title}</td>
                    <td className="px-4 py-3 text-slate-600">{partTypeLabels[s.partType]}</td>
                    <td className="px-4 py-3">{s.partType === "WRITING" || s.partType === "SPEAKING"
                      ? res.answers.filter((a) => a.sectionId === s.sectionId).map((a, i) => `${s.partType === "WRITING" ? "Task" : "Q"}${i + 1}: ${a.pending ? "…" : fmt(a.points)}`).join(" · ")
                      : `${s.correctCount} / ${s.questionCount}`}</td>
                    <td className="px-4 py-3 font-semibold">{s.pending ? <span className="badge bg-amber-50 text-amber-700">tekshirilmoqda</span> : fmt(s.scaledScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="mt-10 text-lg font-bold">Javoblar</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
            <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Javobingiz</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3">Ball</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {numbered.map(({ a, no }) => (
              <tr key={a.questionId} className="align-top">
                <td className="px-4 py-3 whitespace-nowrap">{no}</td>
                <td className="max-w-md px-4 py-3">
                  {a.type === "SPEAKING" ? (a.audioUrl ? <audio src={a.audioUrl} controls className="h-9 w-56" /> : "—")
                    : a.type === "ESSAY" ? <span className="line-clamp-3 whitespace-pre-line text-slate-700">{a.response?.text || "—"}</span>
                    : (a.response?.value ?? a.response?.values?.join(", ") ?? "—")}
                  {a.feedback && <p className="mt-1 whitespace-pre-line rounded bg-slate-50 p-2 text-xs text-slate-600"><b>{a.aiGraded ? "AI baho" : "O'qituvchi"}:</b> {a.feedback}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("badge", a.pending ? "bg-amber-50 text-amber-700" : a.correct === true ? "bg-emerald-50 text-emerald-700" : a.correct === false ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600")}>
                    {a.pending ? "tekshirilmoqda" : a.correct === true ? "to'g'ri" : a.correct === false ? "noto'g'ri" : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{a.points ?? "—"} / {a.maxPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/exams/${res.examId}`} className="btn-primary">Qayta topshirish</Link>
        <Link href="/exams" className="btn-secondary">Boshqa imtihonlar</Link>
        <Link href="/dashboard/exams" className="btn-ghost">Barcha natijalarim</Link>
      </div>
    </div>
  );
}
