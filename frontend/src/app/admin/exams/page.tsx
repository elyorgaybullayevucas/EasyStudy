"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { levelLabels } from "@/lib/format";
import type { ExamSummary } from "@/lib/types";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.admin.exams().then(setExams).catch((e) => setError(e instanceof ApiError ? e.message : "Xatolik"));
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mock imtihonlar</h1>
        <Link href="/admin/exams/new" className="btn-primary">+ Yangi imtihon</Link>
      </div>
      {error && <Alert>{error}</Alert>}
      {!exams ? (!error && <PageLoader />) : exams.length === 0 ? (
        <EmptyState title="Imtihonlar yo'q" description="Birinchi mock imtihonni yarating." action={<Link href="/admin/exams/new" className="btn-primary">+ Yangi imtihon</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
              <tr><th className="px-4 py-3">Imtihon</th><th className="px-4 py-3">Daraja</th><th className="px-4 py-3">Vaqt</th><th className="px-4 py-3">Savollar</th><th className="px-4 py-3">Urinishlar</th><th className="px-4 py-3">Holat</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/exams/${e.id}`} className="font-medium text-brand-700 hover:underline">{e.title}</Link>
                    <p className="font-mono text-xs text-slate-500">{e.code} · {e.category?.name ?? "Kategoriyasiz"} · {e.templateCode ?? "CUSTOM"}</p>
                    <p className="text-xs text-slate-500">{(e.parts ?? []).join(" · ")}</p>
                  </td>
                  <td className="px-4 py-3">{levelLabels[e.level]}</td>
                  <td className="px-4 py-3">{e.totalMinutes} daq</td>
                  <td className="px-4 py-3">{e.questionCount}</td>
                  <td className="px-4 py-3">{e.attemptCount}</td>
                  <td className="px-4 py-3">{e.published ? <span className="badge bg-emerald-50 text-emerald-700">Nashr etilgan</span> : <span className="badge bg-slate-100 text-slate-600">Qoralama</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
