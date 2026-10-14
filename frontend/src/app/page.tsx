"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Exams, type ExamSummary } from "@/lib/api";

export default function HomePage() {
  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Exams.list().then(setExams).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Mock imtihonlar</h1>
      <p className="mb-6 text-slate-600">Darajangizni tekshiring: IELTS, SAT, TOPIK va boshqalar.</p>
      {error && <p className="text-red-600">{error}</p>}
      {!exams && !error && <p>Yuklanmoqda...</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {exams?.map((e) => (
          <Link key={e.id} href={`/exams/${e.id}`} className="rounded-lg border bg-white p-4 hover:shadow">
            <div className="text-xs uppercase text-slate-500">{e.code}</div>
            <div className="text-lg font-semibold">{e.title}</div>
            <div className="mt-1 text-sm text-slate-600">{e.description}</div>
            <div className="mt-3 text-sm text-slate-500">
              {e.totalMinutes} daqiqa · {e.questionCount} savol
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
