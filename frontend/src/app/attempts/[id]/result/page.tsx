"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Attempts, type AttemptResult } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [res, setRes] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return router.push("/login");
    Attempts.result(id).then(setRes).catch((e) => setError(e.message));
  }, [id, user, loading, router]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!res) return <p>Yuklanmoqda...</p>;

  const correct = res.answers.filter((a) => a.correct === true).length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{res.examTitle} - natija</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="To'g'ri javoblar" value={`${correct} / ${res.answers.length}`} />
        <Stat label="Xom ball" value={`${res.rawScore ?? 0} / ${res.maxScore}`} />
        <Stat label="Band / Shkala" value={res.scaledScore != null ? String(res.scaledScore) : "—"} />
      </div>
      {res.status === "SUBMITTED" && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
          Esse savollari o&apos;qituvchi tomonidan tekshiriladi; yakuniy ball keyinroq chiqadi.
        </p>
      )}
      <table className="w-full rounded-lg border bg-white text-sm">
        <thead className="bg-slate-50 text-left">
          <tr><th className="p-2">#</th><th className="p-2">Javobingiz</th><th className="p-2">Holat</th><th className="p-2">Ball</th></tr>
        </thead>
        <tbody>
          {res.answers.map((a, i) => (
            <tr key={a.questionId} className="border-t">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{a.response?.value ?? a.response?.values?.join(", ") ?? (a.response?.text ? "esse" : "—")}</td>
              <td className="p-2">
                {a.correct === true ? <span className="text-green-700">to&apos;g&apos;ri</span>
                  : a.correct === false ? <span className="text-red-600">noto&apos;g&apos;ri</span>
                  : <span className="text-slate-500">tekshirilmoqda</span>}
              </td>
              <td className="p-2">{a.points ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/" className="inline-block rounded border bg-white px-4 py-2">Boshqa imtihon</Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
