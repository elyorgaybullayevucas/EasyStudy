"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Attempts, Exams, type ExamDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Exams.get(id).then(setExam).catch((e) => setError(e.message));
  }, [id]);

  async function start() {
    if (!user) return router.push("/login");
    setBusy(true);
    try {
      const a = await Attempts.start(Number(id));
      router.push(`/attempts/${a.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!exam) return <p>Yuklanmoqda...</p>;

  const total = exam.sections.reduce((s, x) => s + x.durationMinutes, 0);

  return (
    <div className="space-y-4">
      <div className="text-xs uppercase text-slate-500">{exam.code}</div>
      <h1 className="text-2xl font-bold">{exam.title}</h1>
      <p className="text-slate-600">{exam.description}</p>
      <ul className="rounded-lg border bg-white p-4 text-sm">
        {exam.sections.map((s) => (
          <li key={s.id} className="flex justify-between py-1">
            <span>{s.title}</span>
            <span className="text-slate-500">{s.durationMinutes} daqiqa · {s.questions.length} savol</span>
          </li>
        ))}
        <li className="mt-2 flex justify-between border-t pt-2 font-medium">
          <span>Jami</span><span>{total} daqiqa</span>
        </li>
      </ul>
      <p className="text-sm text-slate-500">
        Boshlaganingizdan so&apos;ng taymer serverda ishlaydi; vaqt tugaganda javoblar avtomatik topshiriladi.
      </p>
      <button onClick={start} disabled={busy || loading}
              className="rounded bg-slate-900 px-5 py-2 text-white disabled:opacity-50">
        {user ? "Imtihonni boshlash" : "Boshlash uchun kiring"}
      </button>
    </div>
  );
}
