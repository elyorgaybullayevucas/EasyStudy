"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/format";

export function AdminNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const items = [
    { href: "/admin/subjects", label: "Fanlarim", match: (p: string) => p.startsWith("/admin/subjects") },
    { href: "/admin", label: "Kurslar", match: (p: string) => p === "/admin" || p.startsWith("/admin/courses") },
    { href: "/admin/exams", label: "Mock imtihonlar", match: (p: string) => p.startsWith("/admin/exams") },
    { href: "/admin/grading", label: "Tekshirish navbati", match: (p: string) => p.startsWith("/admin/grading") },
    { href: "/admin/posts", label: "Maqolalar", match: (p: string) => p.startsWith("/admin/posts") },
    { href: "/admin/guide", label: "Yo'riqnoma", match: (p: string) => p.startsWith("/admin/guide") },
    ...(user?.role === "ADMIN"
      ? [
          { href: "/admin/categories", label: "Kategoriyalar", match: (p: string) => p.startsWith("/admin/categories") },
          { href: "/admin/users", label: "Foydalanuvchilar", match: (p: string) => p.startsWith("/admin/users") },
        ]
      : []),
  ];
  return (
    <aside>
      <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">Boshqaruv paneli</p>
      <nav className="flex flex-wrap gap-1 lg:flex-col">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={cn("rounded-lg px-3 py-2 text-sm font-medium", i.match(pathname) ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100")}>
            {i.label}
          </Link>
        ))}
      </nav>
      {user && (
        <div className="mt-6 rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">{user.fullName}</p>
          <p>{user.role === "ADMIN" ? "Administrator: barcha kontent" : "O'qituvchi: sizga biriktirilgan fanlar, o'z kurslaringiz va maqolalaringiz"}</p>
          <Link href={`/teachers/${user.id}`} className="mt-2 inline-block text-brand-700 underline">Ochiq profilim</Link>
        </div>
      )}
    </aside>
  );
}
