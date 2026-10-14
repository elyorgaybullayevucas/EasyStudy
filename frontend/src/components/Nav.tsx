"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Nav() {
  const { user, loading, logout } = useAuth();
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          EasyStudy
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/">Imtihonlar</Link>
          {user && <Link href="/attempts">Natijalarim</Link>}
          {loading ? null : user ? (
            <>
              <span className="text-slate-500">{user.email}</span>
              <button onClick={logout} className="rounded border px-3 py-1 hover:bg-slate-50">
                Chiqish
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Kirish</Link>
              <Link href="/register" className="rounded bg-slate-900 px-3 py-1 text-white">
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
