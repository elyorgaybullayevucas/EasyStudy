"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, wordCount } from "@/lib/format";
import type { GradingAttempt } from "@/lib/types";

export default function GradingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const attemptId = Number(id);
  const [data, setData] = useState<GradingAttempt | null>(null);
  const [grades, setGrades] = useState<Record<number, { points: string; feedback: string }>>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.gradingAttempt(attemptId).then((d) => {
      setData(d);
      const g: Record<number, { points: string; feedback: string }> = {};
      for (const q of d.questions) g[q.questionId] = { points: q.points != null ? String(q.points) : "", feedback: q.feedback ?? "" };
      setGrades(g);
    }).catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [attemptId]);

  if (error && !data) return <Alert>{error}</Alert>;
  if (!data) return <PageLoader />;

  const save = async () => {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const items = data.questions.filter((q) => grades[q.questionId]?.points !== "").map((q) => ({ questionId: q.questionId, points: Number(grades[q.questionId].points), feedback: grades[q.questionId].feedback || undefined }));
      if (items.length === 0) throw new ApiError(400, "Kamida bitta javobga ball qo'ying");
      setData(await api.admin.grade(attemptId, items));
      setMsg("Baholar saqlandi" + (items.length === data.questions.length ? ". Talabaning yakuniy natijasi hisoblandi." : "."));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const s = data.summary;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/grading" className="text-sm text-slate-500 hover:underline">← Tekshirish navbati</Link>
        <h1 className="mt-1 text-2xl font-bold">{s.examTitle}</h1>
        <p className="text-sm text-slate-600">{s.studentName} · {s.studentEmail} · topshirgan: {s.submittedAt ? formatDateTime(s.submittedAt) : "—"}</p>
      </div>
      {error && <Alert>{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      {data.questions.map((q, i) => {
        const g = grades[q.questionId] ?? { points: "", feedback: "" };
        const text = q.response?.text ?? "";
        return (
          <div key={q.questionId} className="card p-6">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{q.sectionTitle} · {i + 1}-vazifa · maks {q.maxPoints} ball</p>
            <p className="mt-2 whitespace-pre-line font-medium">{q.prompt}</p>
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              {q.type === "SPEAKING" ? (
                q.audioUrl ? <audio src={q.audioUrl} controls className="w-full" /> : <p className="text-sm text-slate-500">Talaba ovozli javob yubormagan.</p>
              ) : text ? (
                <><p className="whitespace-pre-line text-sm leading-relaxed">{text}</p><p className="mt-2 text-xs text-slate-500">{wordCount(text)} so&apos;z</p></>
              ) : <p className="text-sm text-slate-500">Talaba javob yozmagan.</p>}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                <label className="label">Ball (0 – {q.maxPoints})</label>
                <input type="number" min={0} max={q.maxPoints} step={0.5} className="input" value={g.points} onChange={(e) => setGrades({ ...grades, [q.questionId]: { ...g, points: e.target.value } })} />
              </div>
              <div>
                <label className="label">Izoh talabaga (ixtiyoriy)</label>
                <textarea rows={2} className="input" placeholder="Kuchli tomonlar, xatolar, tavsiyalar" value={g.feedback} onChange={(e) => setGrades({ ...grades, [q.questionId]: { ...g, feedback: e.target.value } })} />
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="btn-primary btn-lg">{saving ? "Saqlanmoqda..." : "Baholarni saqlash"}</button>
        <Link href="/admin/grading" className="btn-secondary btn-lg">Navbatga qaytish</Link>
      </div>
    </div>
  );
}
