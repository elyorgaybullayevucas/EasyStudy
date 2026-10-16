"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { CheckIcon, FileTextIcon, TimerIcon } from "@/components/ui/Icons";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { levelLabels, partTypeLabels, questionTypeLabels, scoringModeLabels } from "@/lib/format";
import type { ExamDetail, QuestionType } from "@/lib/types";

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.exams.get(id).then(setExam).catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
  }, [id]);

  async function start() {
    if (!user) return router.push(`/login?next=/exams/${id}`);
    setBusy(true);
    try {
      const a = await api.attempts.start(Number(id));
      router.push(`/attempts/${a.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Xatolik");
      setBusy(false);
    }
  }

  if (error && !exam) return <div className="container-page py-10"><Alert>{error}</Alert></div>;
  if (!exam) return <PageLoader />;

  const total = exam.sections.reduce((s, x) => s + x.durationMinutes, 0);
  const questions = exam.sections.flatMap((s) => s.questions);
  const types = [...new Set(questions.map((q) => q.type))] as QuestionType[];
  const needsMic = exam.sections.some((s) => s.partType === "SPEAKING");
  const manualParts = exam.sections.filter((s) => s.manual).map((s) => s.title);

  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="container-page py-12">
          <div className="flex flex-wrap gap-2">
            {exam.category && <span className="badge bg-brand-500/20 text-brand-200">{exam.category.name}</span>}
            <span className="badge bg-white/10 text-slate-200">{levelLabels[exam.level]}</span>
            <span className="badge bg-white/10 font-mono text-slate-200">{exam.code}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{exam.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">{exam.description}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
            <span className="flex items-center gap-1.5"><TimerIcon width={16} height={16} />{total} daqiqa</span>
            <span className="flex items-center gap-1.5"><FileTextIcon width={16} height={16} />{questions.length} ta savol / vazifa</span>
            <span>{exam.sections.length} ta bo&apos;lim</span>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold">Imtihon tuzilmasi</h2>
            <p className="mt-1 text-sm text-slate-500">{exam.navigationMode === "FREE" ? `Haqiqiy imtihondagidek barcha bo'limlar bir vaqtda ochiq, yagona ${total} daqiqalik taymer, savollar orasida erkin yurasiz.` : "Haqiqiy imtihondagidek bo'limlar ketma-ket ochiladi, har birining o'z taymeri bor, bo'limga qaytib bo'lmaydi."} Baholash: {scoringModeLabels[exam.scoringMode]}.</p>
            <ol className="card mt-4 divide-y divide-slate-100">
              {exam.sections.map((s, i) => (
                <li key={s.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium">{s.title} <span className="badge ml-1 bg-slate-100 text-slate-600">{partTypeLabels[s.partType]}</span></p>
                    <p className="text-xs text-slate-500">{s.questions.length} ta {s.manual ? "vazifa · AI darhol baholaydi, o'qituvchi tasdiqlaydi" : "savol · avtomatik tekshiriladi"}{s.audioUrl ? " · audio" : ""}</p>
                  </div>
                  <span className="text-sm text-slate-500">{s.durationMinutes} daq</span>
                </li>
              ))}
            </ol>
          </section>
          {exam.instructions && (
            <section className="card p-6"><h3 className="font-semibold">Imtihon haqida</h3><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{exam.instructions}</p></section>
          )}
          <section>
            <h2 className="text-xl font-bold">Savol turlari</h2>
            <div className="mt-3 flex flex-wrap gap-2">{types.map((t) => <span key={t} className="badge bg-slate-100 text-slate-700">{questionTypeLabels[t]}</span>)}</div>
          </section>
          <section className="card p-6">
            <h3 className="font-semibold">Qoidalar</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {[...(exam.navigationMode === "FREE"
                  ? ["\"Boshlash\" bosilganda barcha bo'limlar ochiladi va yagona taymer serverda ishlaydi; sahifani yopsangiz ham vaqt to'xtamaydi.", "Fanlar va savollar orasida erkin yurasiz, javobni istalgan vaqt o'zgartirasiz. Vaqt tugaganda yoki \"Topshirish\" bosilganda natija darhol chiqadi."]
                  : ["Har bo'lim \"Boshlash\" bosilganda ochiladi va taymeri serverda ishlaydi; sahifani yopsangiz ham vaqt to'xtamaydi.", "Bo'limni yakunlagach unga qaytib bo'lmaydi (haqiqiy imtihondagidek)."]),
                "Javoblar avtomatik saqlanadi. Vaqt tugaganda bo'lim o'zi yakunlanadi.",
                ...(exam.sections.some((s) => s.partType === "LISTENING") ? ["Listening audiosi bo'lim boshlanishi bilan avtomatik ijro etiladi va faqat bir marta eshittiriladi; to'xtatib yoki qaytarib bo'lmaydi."] : []),
                ...(manualParts.length ? [`${manualParts.join(", ")} javoblari AI tomonidan darhol baholanadi; o'qituvchi keyinroq tasdiqlaydi.`] : []),
                ...(needsMic ? ["Speaking: har savol ovoz bilan o'qiladi, javob mikrofonga bir marta yoziladi."] : [])].map((r) => (
                <li key={r} className="flex gap-2"><CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-accent-600" />{r}</li>
              ))}
            </ul>
          </section>
        </div>
        <aside>
          <div className="card sticky top-24 p-6">
            <p className="text-3xl font-bold">Bepul</p>
            <p className="mt-1 text-sm text-slate-500">{total} daqiqa · {exam.sections.length} bo&apos;lim</p>
            {error && <Alert className="mt-4">{error}</Alert>}
            <button onClick={start} disabled={busy || loading} className="btn-primary btn-lg mt-5 w-full">{busy ? "Boshlanmoqda..." : user ? "Imtihonni boshlash" : "Boshlash uchun kiring"}</button>
            {user && <Link href="/dashboard/exams" className="btn-secondary mt-3 w-full">Oldingi natijalarim</Link>}
          </div>
        </aside>
      </div>
    </>
  );
}
