"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn, statusLabels } from "@/lib/format";
import type { AttemptResult } from "@/lib/types";

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

  const correct = res.answers.filter((a) => a.correct === true).length;
  const pct = res.maxScore > 0 ? Math.round(((res.rawScore ?? 0) / res.maxScore) * 100) : 0;

  return (
    <div className="container-page max-w-4xl py-10">
      <p className="text-sm text-slate-500">Mock imtihon natijasi · {statusLabels[res.status]}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{res.examTitle}</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Band / Shkala" value={res.scaledScore != null ? String(res.scaledScore) : "—"} big />
        <Stat label="To'g'ri javoblar" value={`${correct} / ${res.answers.length}`} />
        <Stat label="Xom ball" value={`${res.rawScore ?? 0} / ${res.maxScore} (${pct}%)`} />
      </div>

      {res.status === "SUBMITTED" && (
        <Alert type="info" className="mt-6">Esse savollari o&apos;qituvchi tomonidan tekshiriladi; yakuniy ball keyinroq chiqadi.</Alert>
      )}

      <div className="card mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
            <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Javobingiz</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3">Ball</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {res.answers.map((a, i) => (
              <tr key={a.questionId}>
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">{a.response?.value ?? a.response?.values?.join(", ") ?? (a.response?.text ? "esse" : "—")}</td>
                <td className="px-4 py-3">
                  <span className={cn("badge", a.correct === true ? "bg-emerald-50 text-emerald-700" : a.correct === false ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600")}>
                    {a.correct === true ? "to'g'ri" : a.correct === false ? "noto'g'ri" : "tekshirilmoqda"}
                  </span>
                </td>
                <td className="px-4 py-3">{a.points ?? "—"}</td>
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

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={cn("card p-5", big && "bg-gradient-to-br from-brand-700 to-indigo-700 text-white")}>
      <p className={cn("text-xs", big ? "text-brand-100" : "text-slate-500")}>{label}</p>
      <p className={cn("font-bold", big ? "text-4xl" : "text-2xl")}>{value}</p>
    </div>
  );
}
