"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { PostListItem } from "@/lib/types";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostListItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api.admin.posts({ search }).then((p) => setPosts(p.items)).catch((e) => setError(e instanceof ApiError ? e.message : "Xatolik"));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Maqolalar</h1>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="input w-56" />
          <Link href="/admin/posts/new" className="btn-primary whitespace-nowrap">+ Yangi maqola</Link>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      {!posts ? (!error && <PageLoader />) : posts.length === 0 ? (
        <EmptyState title="Maqolalar yo'q" description="O'z sohangiz bo'yicha birinchi maqolangizni yozing." action={<Link href="/admin/posts/new" className="btn-primary">+ Yangi maqola</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
              <tr><th className="px-4 py-3">Maqola</th><th className="px-4 py-3">Muallif</th><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Ko&apos;rishlar</th><th className="px-4 py-3">Holat</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/posts/${p.id}`} className="font-medium text-brand-700 hover:underline">{p.title}</Link>
                    <p className="text-xs text-slate-500">{p.category?.name ?? "Kategoriyasiz"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.author.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">{p.views}</td>
                  <td className="px-4 py-3">{p.published ? <span className="badge bg-emerald-50 text-emerald-700">Nashr etilgan</span> : <span className="badge bg-slate-100 text-slate-600">Qoralama</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
