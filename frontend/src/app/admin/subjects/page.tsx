"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { CategoryIcon } from "@/components/ui/Icons";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { groupLabels } from "@/lib/format";
import type { Category } from "@/lib/types";

/** O'qituvchi: biriktirilgan fanlar; admin: barcha yo'nalishlar. */
export default function AdminSubjectsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Category[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.admin.mySubjects().then(setItems).catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi")); }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!items) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fanlarim</h1>
        <p className="mt-1 text-sm text-slate-600">{user?.role === "ADMIN" ? "Barcha yo'nalishlar. O'qituvchilarni biriktirish — Kategoriyalar bo'limida." : "Sizga biriktirilgan fanlar: bosqichlar, darslar, testlar va mock'larni shu yerdan boshqarasiz, talabalar natijalarini kuzatasiz."}</p>
      </div>
      {items.length === 0 ? (
        <Alert type="info">Sizga hali fan biriktirilmagan. Administratorga murojaat qiling.</Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((c) => (
            <Link key={c.id} href={`/admin/subjects/${c.slug}`} className="card flex items-center gap-4 p-5 transition hover:border-brand-300 hover:shadow-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><CategoryIcon icon={c.icon} width={22} height={22} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name} <span className="badge ml-1 bg-slate-100 text-slate-600">{groupLabels[c.group].title}</span></p>
                <p className="text-xs text-slate-500">{c.courseCount} kurs · {c.examCount} imtihon{c.placementExam ? " · daraja testi bor" : " · daraja testi yo'q"}{c.teachers.length ? ` · ${c.teachers.map((t) => t.fullName).join(", ")}` : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
