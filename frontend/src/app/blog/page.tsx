import type { Metadata } from "next";
import Link from "next/link";

import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon } from "@/components/ui/Icons";
import { serverFetch } from "@/lib/api";
import { cn } from "@/lib/format";
import type { Category, Page, PostListItem } from "@/lib/types";

export const metadata: Metadata = { title: "Maqolalar" };

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const search = get("search"), category = get("category");
  const page = Math.max(1, Number(get("page")) || 1);
  const q = new URLSearchParams({ page: String(page), size: "12" });
  if (search) q.set("search", search);
  if (category) q.set("category", category);

  const [data, categories] = await Promise.all([
    serverFetch<Page<PostListItem>>(`/api/posts?${q}`, { items: [], total: 0, page, size: 12 }, 10),
    serverFetch<Category[]>("/api/categories", []),
  ]);
  const totalPages = Math.max(1, Math.ceil(data.total / 12));

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Maqolalar</h1>
        <p className="mt-1 text-slate-600">O&apos;qituvchilarning tajribasi, strategiyalar va maslahatlar</p>
      </div>
      <form action="/blog" className="mb-6 flex flex-col gap-3 sm:flex-row">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" width={18} height={18} />
          <input name="search" defaultValue={search} placeholder="Maqola qidirish..." className="input pl-10" />
        </div>
        <button className="btn-primary">Qidirish</button>
      </form>
      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/blog" className={cn("rounded-full px-4 py-1.5 text-sm font-medium", !category ? "bg-brand-600 text-white" : "border border-slate-300 bg-white")}>Barchasi</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/blog?category=${c.slug}`} className={cn("rounded-full px-4 py-1.5 text-sm font-medium", category === c.slug ? "bg-brand-600 text-white" : "border border-slate-300 bg-white")}>{c.name}</Link>
        ))}
      </div>
      {data.items.length === 0 ? (
        <EmptyState title="Maqola topilmadi" description="Hozircha bu bo'limda maqola yo'q." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((p) => <PostCard key={p.id} post={p} />)}</div>
      )}
      {totalPages > 1 && (
        <nav className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/blog?${new URLSearchParams({ ...(search && { search }), ...(category && { category }), page: String(p) })}`}
              className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium", p === page ? "bg-brand-600 text-white" : "border border-slate-300 bg-white")}>{p}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
