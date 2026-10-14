import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CertificateActions } from "@/components/course/CertificateActions";
import { serverFetch } from "@/lib/api";
import { formatDate, formatDuration } from "@/lib/format";
import type { Certificate } from "@/lib/types";

type Props = { params: Promise<{ code: string }> };
const getCertificate = (code: string) => serverFetch<Certificate | null>(`/api/certificates/${encodeURIComponent(code)}`, null, 60);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cert = await getCertificate((await params).code);
  return cert ? { title: `${cert.studentName} — ${cert.courseTitle}`, description: "EasyStudy platformasi sertifikati" } : { title: "Sertifikat topilmadi" };
}

export default async function CertificatePage({ params }: Props) {
  const { code } = await params;
  const cert = await getCertificate(code);
  if (!cert) notFound();

  return (
    <div className="container-page py-10">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Sertifikat haqiqiy va tasdiqlangan</div>
        <CertificateActions />
      </div>
      <div className="mx-auto aspect-[1.414] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl print:rounded-none print:shadow-none">
        <div className="relative flex h-full flex-col border-[14px] border-brand-900 p-6 sm:p-12">
          <div className="pointer-events-none absolute inset-3 border-2 border-amber-400/70" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-lg font-bold text-white">E</span>
              <span className="text-xl font-bold text-brand-900">EasyStudy</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500 sm:text-xs">№ {cert.code}</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold tracking-[0.3em] text-amber-600 uppercase sm:text-sm">Sertifikat</p>
            <p className="mt-3 text-xs text-slate-500 sm:mt-6 sm:text-base">Ushbu sertifikat</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900 sm:mt-3 sm:text-5xl">{cert.studentName}</h1>
            <div className="mx-auto my-3 h-px w-2/3 bg-slate-300 sm:my-5" />
            <p className="max-w-2xl text-xs text-slate-600 sm:text-base">ga quyidagi online kursni muvaffaqiyatli tamomlagani uchun berildi:</p>
            <h2 className="mt-2 text-base font-bold text-brand-800 sm:mt-4 sm:text-3xl">«{cert.courseTitle}»</h2>
            {cert.totalMinutes > 0 && <p className="mt-1 text-[10px] text-slate-500 sm:mt-2 sm:text-sm">Kurs davomiyligi: {formatDuration(cert.totalMinutes)}</p>}
          </div>
          <div className="grid grid-cols-2 items-end gap-6 text-[10px] sm:text-sm">
            <div><p className="font-semibold text-slate-800">{formatDate(cert.issuedAt)}</p><p className="border-t border-slate-300 pt-1 text-slate-500">Berilgan sana</p></div>
            <div className="text-right"><p className="font-semibold text-slate-800">{cert.instructorName ?? "EasyStudy"}</p><p className="border-t border-slate-300 pt-1 text-slate-500">O&apos;qituvchi</p></div>
          </div>
        </div>
      </div>
      <p className="no-print mt-6 text-center text-sm text-slate-500">
        Sertifikatni tekshirish: <span className="font-mono">{cert.code}</span> • <Link href={`/courses/${cert.courseSlug}`} className="text-brand-700 hover:underline">Kurs sahifasi</Link>
      </p>
    </div>
  );
}
