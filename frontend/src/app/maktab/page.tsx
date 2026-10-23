import type { Metadata } from "next";
import Link from "next/link";

import { CategoryIcon, CheckIcon } from "@/components/ui/Icons";
import { serverFetch } from "@/lib/api";
import type { Subject } from "@/lib/types";

export const metadata: Metadata = { title: "Onlayn maktab", description: "Fanlar bo'yicha bosqichma-bosqich o'qish: daraja testi, darslar, mavzu testlari, mock imtihonlar" };

const how = [
  { n: "1", title: "Darajani aniqlang", text: "Fan bo'yicha qisqa test topshiring. Natijaga ko'ra qaysi bosqichdan boshlashingiz belgilanadi." },
  { n: "2", title: "Bosqichda o'qing", text: "Har mavzu: video, konspekt va mavzu testi. Keyingi dars testdan o'tgach ochiladi." },
  { n: "3", title: "Bo'lim mock'i", text: "Bo'lim tugagach haqiqiy imtihon uslubidagi mock bilan tayyorgarlikni tekshiring." },
  { n: "4", title: "Yakuniy imtihon", text: "Bosqich oxirida yakuniy imtihon: 70%+ bilan keyingi bosqich ochiladi, sertifikat beriladi." },
];

export default async function SchoolPage() {
  const subjects = await serverFetch<Subject[]>("/api/subjects", [], 10);
  return (
    <div className="container-page py-10">
      <div className="max-w-3xl">
        <span className="badge bg-brand-50 text-brand-700">Onlayn maktab</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Fanlarni bosqichma-bosqich o&apos;rganing</h1>
        <p className="mt-3 text-lg text-slate-600">
          Sinf emas, daraja: avval qisqa test bilan hozirgi darajangiz aniqlanadi, so&apos;ng aynan sizga mos bosqichdan boshlaysiz.
          Har fan DTM, Milliy sertifikat yoki xalqaro imtihonga haqiqiy formatdagi mock&apos;lar bilan tayyorlaydi.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {how.map((h) => (
          <div key={h.n} className="card p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{h.n}</span>
            <h3 className="mt-3 font-semibold">{h.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{h.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-bold">Fanlar</h2>
      {subjects.length === 0 ? <p className="mt-3 text-sm text-slate-500">Fanlar hozircha qo&apos;shilmagan.</p> : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Link key={s.id} href={`/maktab/${s.slug}`} className="card group p-5 transition hover:border-brand-300 hover:shadow-md">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white"><CategoryIcon icon={s.icon} width={24} height={24} /></span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs text-slate-500">{s.stages.length} bosqich · {s.examCount} mock{s.placementExam ? " · daraja testi bor" : ""}</p>
                </div>
              </div>
              {s.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{s.description}</p>}
              {s.certifications.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-1 text-xs">
                  {s.certifications.map((c) => <span key={c.id} className="badge bg-emerald-50 text-emerald-700"><CheckIcon width={11} height={11} /> {c.name}</span>)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
