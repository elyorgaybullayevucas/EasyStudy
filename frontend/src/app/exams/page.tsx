import type { Metadata } from "next";
import Link from "next/link";

import { ExamCard } from "@/components/exam/ExamCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { serverFetch } from "@/lib/api";
import { cn } from "@/lib/format";
import type { Category, ExamSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Mock imtihonlar" };

export default async function ExamsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : "";
  const [exams, categories] = await Promise.all([
    serverFetch<ExamSummary[]>(`/api/exams${category ? `?category=${encodeURIComponent(category)}` : ""}`, [], 10),
    serverFetch<Category[]>("/api/categories", []),
  ]);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mock imtihonlar</h1>
        <p className="mt-1 text-slate-600">Real format, taymer, avtomatik baholash va band/ball konversiyasi. Darajangizni tekshiring.</p>
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/exams" className={cn("rounded-full px-4 py-1.5 text-sm font-medium", !category ? "bg-brand-600 text-white" : "border border-slate-300 bg-white hover:bg-slate-50")}>Barchasi</Link>
        {categories.filter((c) => c.examCount > 0).map((c) => (
          <Link key={c.id} href={`/exams?category=${c.slug}`} className={cn("rounded-full px-4 py-1.5 text-sm font-medium", category === c.slug ? "bg-brand-600 text-white" : "border border-slate-300 bg-white hover:bg-slate-50")}>
            {c.name} ({c.examCount})
          </Link>
        ))}
      </div>
      {exams.length === 0 ? (
        <EmptyState title="Imtihon topilmadi" description="Bu yo'nalishda hozircha mock imtihon yo'q." action={<Link href="/exams" className="btn-secondary">Barchasini ko&apos;rish</Link>} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{exams.map((e) => <ExamCard key={e.id} exam={e} />)}</div>
      )}
    </div>
  );
}
