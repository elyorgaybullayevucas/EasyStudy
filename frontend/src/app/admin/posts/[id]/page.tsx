"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError, type PostInput } from "@/lib/api";
import type { Category } from "@/lib/types";

const empty: PostInput = { title: "", excerpt: "", content: "", coverUrl: null, categoryId: null, published: false };

export default function PostEditorPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const postId = Number(params.id);
  const router = useRouter();
  const [form, setForm] = useState<PostInput | null>(isNew ? empty : null);
  const [slug, setSlug] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api.admin.categories().then(setCategories).catch(() => undefined);
    if (!isNew) {
      api.admin.post(postId)
        .then((p) => { setForm({ title: p.title, excerpt: p.excerpt, content: p.content, coverUrl: p.coverUrl, categoryId: p.category?.id ?? null, published: p.published }); setSlug(p.slug); })
        .catch((e) => setError(e instanceof ApiError ? e.message : "Yuklab bo'lmadi"));
    }
  }, [isNew, postId]);

  if (!form) return error ? <Alert>{error}</Alert> : <PageLoader />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const data = { ...form, coverUrl: form.coverUrl || null };
      if (isNew) {
        const p = await api.admin.createPost(data);
        router.replace(`/admin/posts/${p.id}`);
      } else {
        const p = await api.admin.updatePost(postId, data);
        setSlug(p.slug);
        setMsg("Saqlandi");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const words = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/posts" className="text-sm text-slate-500 hover:underline">← Maqolalar</Link>
          <h1 className="mt-1 text-2xl font-bold">{isNew ? "Yangi maqola" : "Maqolani tahrirlash"}</h1>
        </div>
        {!isNew && (
          <div className="flex gap-2">
            {slug && <Link href={`/blog/${slug}`} className="btn-secondary">Ko&apos;rish</Link>}
            {confirmDelete ? (
              <>
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost">Bekor</button>
                <button type="button" onClick={async () => { await api.admin.deletePost(postId); router.push("/admin/posts"); }} className="btn-danger">Ha, o&apos;chirish</button>
              </>
            ) : <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger">O&apos;chirish</button>}
          </div>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}
      <div className="card space-y-5 p-6">
        <div><label className="label">Sarlavha</label><input className="input" required minLength={3} maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label className="label">Qisqa annotatsiya (ro&apos;yxatda ko&apos;rinadi)</label><textarea rows={2} className="input" required minLength={10} maxLength={400} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Yo&apos;nalish</label>
            <select className="input" value={form.categoryId ?? ""} onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">— Tanlanmagan —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Muqova rasmi havolasi</label><input type="url" className="input" placeholder="https://..." value={form.coverUrl ?? ""} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} /></div>
        </div>
        <div>
          <label className="label">Matn</label>
          <textarea rows={18} className="input font-sans" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <p className="mt-1 text-xs text-slate-500">{words} so&apos;z · bo&apos;sh qator bilan abzats ajratiladi</p>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />Nashr etilgan (hammaga ko&apos;rinadi)</label>
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : isNew ? "Maqolani yaratish" : "Saqlash"}</button>
      </div>
    </form>
  );
}
