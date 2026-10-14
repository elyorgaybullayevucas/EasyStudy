"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn, formatDateTime, statusLabels } from "@/lib/format";
import type { AttemptView } from "@/lib/types";

export default function MyExamsPage() {
  const [items, setItems] = useState<AttemptView[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.attempts.mine().then(setItems).catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, []);

  // Har bir imtihon uchun eng yaxshi natija
  const best = new Map<number, number>();
  for (const a of items ?? []) if (a.scaledScore != null) best.set(a.examId, Math.max(best.get(a.examId) ?? -Infinity, a.scaledScore));

  return (
    <>
      <DashboardHeader />
      <div className="container-page py-8">
        {error && <Alert>{error}</Alert>}
        {!items ? (!error && <PageLoader />) : items.length === 0 ? (
          <EmptyState title="Hali mock imtihon topshirmagansiz" description="Darajangizni tekshirish uchun birinchi imtihoningizni boshlang."
            action={<Link href="/exams" className="btn-primary">Imtihonlarni ko&apos;rish</Link>} />
        ) : (
          <>
            {best.size > 0 && (
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...best.entries()].map(([examId, score]) => {
                  const a = items.find((x) => x.examId === examId)!;
                  return (
                    <div key={examId} className="card p-5">
                      <p className="truncate text-xs text-slate-500">{a.examTitle}</p>
                      <p className="mt-1 text-3xl font-bold text-brand-700">{score}</p>
                      <p className="text-xs text-slate-500">eng yaxshi natija</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr><th className="px-4 py-3">Imtihon</th><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3">Natija</th><th className="px-4 py-3"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{a.examTitle}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(a.startedAt)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("badge", a.status === "GRADED" ? "bg-emerald-50 text-emerald-700" : a.status === "IN_PROGRESS" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700")}>{statusLabels[a.status]}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{a.scaledScore ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={a.status === "IN_PROGRESS" ? `/attempts/${a.id}` : `/attempts/${a.id}/result`} className="btn-secondary py-1.5">
                          {a.status === "IN_PROGRESS" ? "Davom etish" : "Natija"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
