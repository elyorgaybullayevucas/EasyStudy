"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn, formatDateTime, statusLabels } from "@/lib/format";
import type { GradingRow } from "@/lib/types";

export default function GradingQueuePage() {
  const [rows, setRows] = useState<GradingRow[] | null>(null);
  const [all, setAll] = useState(false);
  const [error, setError] = useState("");
  const [ai, setAi] = useState<string[]>([]);

  useEffect(() => {
    setRows(null);
    api.admin.grading(all).then(setRows).catch((e) => setError(e instanceof ApiError ? e.message : "Xatolik"));
  }, [all]);
  useEffect(() => { api.admin.aiStatus().then(setAi).catch(() => undefined); }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tekshirish navbati</h1>
          <p className="text-sm text-slate-500">Writing va Speaking javoblari. Baho qo&apos;yilgach talabaning yakuniy natijasi hisoblanadi.</p>
          {ai.length > 0 && <p className="mt-1 text-xs text-slate-500">AI tekshiruv: {ai.join(" · ")}. AI baholagan ishlarni &quot;Barchasi&quot; da ko&apos;rib, ballni o&apos;zgartirishingiz mumkin.</p>}
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          <button onClick={() => setAll(false)} className={cn("rounded-md px-3 py-1.5 font-medium", !all ? "bg-white shadow-sm" : "text-slate-600")}>Kutilayotgan</button>
          <button onClick={() => setAll(true)} className={cn("rounded-md px-3 py-1.5 font-medium", all ? "bg-white shadow-sm" : "text-slate-600")}>Barchasi</button>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      {!rows ? (!error && <PageLoader />) : rows.length === 0 ? (
        <EmptyState title="Tekshiriladigan ish yo'q" description="Talabalar Writing yoki Speaking bo'limini topshirganda shu yerda paydo bo'ladi." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
              <tr><th className="px-4 py-3">Talaba</th><th className="px-4 py-3">Imtihon</th><th className="px-4 py-3">Topshirgan</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.attemptId} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><p className="font-medium">{r.studentName}</p><p className="text-xs text-slate-500">{r.studentEmail}</p></td>
                  <td className="px-4 py-3">{r.examTitle}</td>
                  <td className="px-4 py-3 text-slate-600">{r.submittedAt ? formatDateTime(r.submittedAt) : "—"}</td>
                  <td className="px-4 py-3">
                    {r.pendingCount > 0 ? <span className="badge bg-amber-50 text-amber-700">{r.pendingCount} ta tekshirilmagan</span> : <span className="badge bg-emerald-50 text-emerald-700">{statusLabels[r.status]}</span>}
                    {r.aiGraded && <span className="badge ml-1 bg-violet-50 text-violet-700">AI baholagan</span>}
                    {r.aiStatus === "FAILED" && <span className="badge ml-1 bg-red-50 text-red-700">AI xato</span>}
                  </td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/grading/${r.attemptId}`} className="btn-primary py-1.5">{r.pendingCount > 0 ? "Tekshirish" : "Ko'rish"}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
