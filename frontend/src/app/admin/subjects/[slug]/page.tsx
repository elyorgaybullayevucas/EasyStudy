"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, statusLabels } from "@/lib/format";
import type { SubjectOverview } from "@/lib/types";

/** Fan nazorati: bosqichlar/kurslar, imtihonlar, talabalar va so'nggi natijalar. */
export default function SubjectOverviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [o, setO] = useState<SubjectOverview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.admin.subjectOverview(slug).then(setO).catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi")); }, [slug]);

  if (error) return <Alert>{error}</Alert>;
  if (!o) return <PageLoader />;
  const stages = o.courses.filter((c) => c.stage != null).sort((a, b) => (a.stage ?? 0) - (b.stage ?? 0));
  const others = o.courses.filter((c) => c.stage == null);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/subjects" className="text-sm text-slate-500 hover:underline">← Fanlarim</Link>
          <h1 className="mt-1 text-2xl font-bold">{o.subject.name}</h1>
          <p className="text-sm text-slate-600">{o.subject.description}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/courses/new" className="btn-primary">+ Bosqich (kurs) qo&apos;shish</Link>
          <Link href="/admin/exams" className="btn-secondary">Mock imtihonlar</Link>
          <Link href={`/maktab/${o.subject.slug}`} className="btn-ghost">Talaba ko&apos;rinishi</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[["Bosqichlar", stages.length], ["Talabalar (yozilgan)", o.students], ["Daraja testini topshirganlar", o.placements], ["Imtihonlar", o.exams.length]].map(([l, v]) => (
          <div key={String(l)} className="card p-5"><p className="text-2xl font-bold">{v}</p><p className="text-xs text-slate-500">{l}</p></div>
        ))}
      </div>

      {!o.subject.placementExam && <Alert type="info">Bu fan uchun daraja aniqlash testi tanlanmagan: Kategoriyalar bo&apos;limida (admin) fan sozlamalarida &quot;Daraja testi&quot; ni tanlang. Testni Mock imtihonlar &gt; &quot;Bo&apos;sh&quot; shablonidan 15-20 savol bilan yarating (oson → qiyin).</Alert>}
      {o.subject.placementExam && <p className="text-sm text-slate-600">Daraja testi: <Link href={`/admin/exams`} className="text-brand-700 underline">{o.subject.placementExam.title}</Link> · {o.subject.placementExam.questionCount} savol</p>}

      <section>
        <h2 className="text-lg font-semibold">Bosqichlar</h2>
        {stages.length === 0 ? <p className="mt-2 text-sm text-slate-500">Bosqich kurslari hali yo&apos;q. Kurs yaratishda &quot;Bosqich raqami&quot; va &quot;minimal foiz&quot; ni kiriting.</p> : (
          <ol className="card mt-3 divide-y divide-slate-100">
            {stages.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{c.stage}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.title} {!c.published && <span className="badge ml-1 bg-amber-50 text-amber-700">nashr etilmagan</span>}</p>
                  <p className="text-xs text-slate-500">{c.lessonCount} dars · {c.studentCount} talaba · daraja testidan {c.minPlacementScore}%+{c.sequential ? " · ketma-ket" : ""}</p>
                </div>
                <Link href={`/admin/courses/${c.id}`} className="btn-secondary">Materiallar</Link>
              </li>
            ))}
          </ol>
        )}
        {others.length > 0 && (
          <>
            <h3 className="mt-6 text-sm font-semibold text-slate-600">Boshqa kurslar (bosqichsiz)</h3>
            <ul className="card mt-2 divide-y divide-slate-100">
              {others.map((c) => (
                <li key={c.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1"><p className="font-medium">{c.title}</p><p className="text-xs text-slate-500">{c.lessonCount} dars · {c.studentCount} talaba</p></div>
                  <Link href={`/admin/courses/${c.id}`} className="btn-ghost">Tahrirlash</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Fan imtihonlari ({o.exams.length})</h2>
        <ul className="card mt-3 divide-y divide-slate-100">
          {o.exams.map((e) => (
            <li key={e.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1"><p className="font-medium">{e.title} {!e.published && <span className="badge ml-1 bg-amber-50 text-amber-700">nashr etilmagan</span>}</p><p className="text-xs text-slate-500">{e.questionCount} savol · {e.totalMinutes} daq · {e.attemptCount} urinish</p></div>
              <Link href={`/admin/exams/${e.id}`} className="btn-ghost">Tahrirlash</Link>
            </li>
          ))}
          {o.exams.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">Imtihon yo&apos;q.</li>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">So&apos;nggi natijalar</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="px-4 py-3">Talaba</th><th className="px-4 py-3">Imtihon</th><th className="px-4 py-3">Natija</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3">Sana</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {o.recentAttempts.map((a) => (
                <tr key={a.attemptId}>
                  <td className="px-4 py-3 font-medium">{a.studentName}</td>
                  <td className="px-4 py-3">{a.examTitle}</td>
                  <td className="px-4 py-3">{a.scaledScore ?? a.rawScore ?? "—"}</td>
                  <td className="px-4 py-3"><span className="badge bg-slate-100 text-slate-600">{statusLabels[a.status]}</span></td>
                  <td className="px-4 py-3 text-slate-500">{a.submittedAt ? formatDateTime(a.submittedAt) : "—"}</td>
                </tr>
              ))}
              {o.recentAttempts.length === 0 && <tr><td className="px-4 py-4 text-slate-500" colSpan={5}>Hali natija yo&apos;q.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
