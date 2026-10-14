"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "./Logo";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/learn/") || /^\/attempts\/\d+$/.test(pathname)) return null;

  return (
    <footer className="no-print mt-20 bg-slate-900 text-slate-400">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            IELTS, SAT, TOPIK va boshqa xalqaro sertifikatlarga tayyorlov: video kurslar, mock imtihonlar,
            o&apos;qituvchilar maqolalari va onlayn tekshiriladigan sertifikatlar.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Platforma</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/courses" className="hover:text-white">Kurslar</Link></li>
            <li><Link href="/exams" className="hover:text-white">Mock imtihonlar</Link></li>
            <li><Link href="/blog" className="hover:text-white">Maqolalar</Link></li>
            <li><Link href="/certificates/verify" className="hover:text-white">Sertifikatni tekshirish</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Hisob</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/register" className="hover:text-white">Ro&apos;yxatdan o&apos;tish</Link></li>
            <li><Link href="/login" className="hover:text-white">Kirish</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Shaxsiy kabinet</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container-page py-6 text-xs">© {new Date().getFullYear()} EasyStudy. Barcha huquqlar himoyalangan.</div>
      </div>
    </footer>
  );
}
