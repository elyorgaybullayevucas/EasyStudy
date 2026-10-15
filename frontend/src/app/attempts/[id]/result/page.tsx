"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn, partTypeLabels, statusLabels } from "@/lib/format";
import type { AttemptResult } from "@/lib/types";

const scoreTitle = { TOTAL: "Umumiy ball", SECTION_AVERAGE: "Umumiy band", SECTION_SUM: "Umumiy ball" };

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

  if (error) return <div className="container-page py-10"><Alert>{error}</Alert></div>;
  if (!res) return <PageLoader />;

  const auto = res.answers.filter((a) => a.type !== "ESSAY" && a.type !== "SPEAKING");
  const correct = auto.filter((a) => a.correct === true).length;

  return (
    <div className="container-page max-w-4xl py-10">
      <p className="text-sm text-slate-500">Mock imtihon natijasi · {statusLabels[res.status]}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{res.examTitle}</h1>

      {res.pendingCount > 0 && (
        <Alert type="info" className="mt-6">
          {res.pendingCount} ta Writing/Speaking javobi o&apos;qituvchi tomonidan tekshirilmoqda. Yakuniy natija tekshiruvdan so&apos;ng shu sahifada chiqadi.
        </Alert>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card bg-gradient-to-br from-brand-700 to-indigo-700 p-5 text-white">
          <p className="text-xs text-brand-100">{scoreTitle[res.scoringMode]}</p>
          <p className="text-4xl font-bold">{res.scaledScore ?? (res.pendingCount > 0 ? "…" : "—")}</p>
          {res.label && <p className="mt-1 text-sm font-semibold text-accent-400">{res.label}</p>}
        </div>
        <div className="card p-5"><p className="text-xs text-slate-500">Avtomatik tekshirilgan</p><p className="text-2xl font-bold">{correct} / {auto.length}</p><p className="text-xs text-slate-500">to&apos;g&apos;ri javob</p></div>
        <div className="card p-5"><p className="text-xs text-slate-500">Xom ball</p><p className="text-2xl font-bold">{res.rawScore ?? 0} / {res.maxScore}</p></div>
      </div>

      <h2 className="mt-10 text-lg font-bold">Bo&apos;limlar bo&apos;yicha</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
            <tr><th className="px-4 py-3">Bo&apos;lim</th><th className="px-4 py-3">Tur</th><th className="px-4 py-3">Xom ball</th><th className="px-4 py-3">Band / shkala</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {res.sections.map((s) => (
              <tr key={s.sectionId}>
                <td className="px-4 py-3 font-medium">{s.title}</td>
                <td className="px-4 py-3 text-slate-600">{partTypeLabels[s.partType]}</td>
                <td className="px-4 py-3">{s.rawScore ?? 0} / {s.maxScore ?? 0}</td>
                <td className="px-4 py-3 font-semibold">{s.pending ? <span className="badge bg-amber-50 text-amber-700">tekshirilmoqda</span> : (s.scaledScore ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-bold">Javoblar</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
            <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Javobingiz</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3">Ball</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {res.answers.map((a, i) => (
              <tr key={a.questionId} className="align-top">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="max-w-md px-4 py-3">
                  {a.type === "SPEAKING" ? (a.audioUrl ? <audio src={a.audioUrl} controls className="h-9 w-56" /> : "—")
                    : a.type === "ESSAY" ? <span className="line-clamp-3 whitespace-pre-line text-slate-700">{a.response?.text || "—"}</span>
                    : (a.response?.value ?? a.response?.values?.join(", ") ?? "—")}
                  {a.feedback && <p className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600"><b>O&apos;qituvchi:</b> {a.feedback}</p>}
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
