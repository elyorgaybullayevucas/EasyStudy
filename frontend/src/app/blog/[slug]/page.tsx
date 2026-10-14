import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/post/PostCard";
import { EyeIcon } from "@/components/ui/Icons";
import { serverFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { PostDetail } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };
const getPost = (slug: string) => serverFetch<PostDetail | null>(`/api/posts/${encodeURIComponent(slug)}`, null, 10);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.title, description: post.excerpt } : { title: "Maqola topilmadi" };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="container-page max-w-3xl py-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {post.category && <Link href={`/blog?category=${post.category.slug}`} className="badge bg-brand-50 text-brand-700">{post.category.name}</Link>}
        <span>{formatDate(post.createdAt)}</span>
        <span className="flex items-center gap-1"><EyeIcon width={14} height={14} />{post.views}</span>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-4 text-lg text-slate-600">{post.excerpt}</p>

      <Link href={`/teachers/${post.author.id}`} className="card mt-6 flex items-center gap-4 p-4 transition hover:border-brand-300">
        <Avatar name={post.author.fullName} url={post.author.avatarUrl} size={48} />
        <div>
          <p className="font-semibold">{post.author.fullName}</p>
          <p className="text-sm text-slate-500">{post.author.headline ?? "O'qituvchi"}</p>
        </div>
      </Link>

      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverUrl} alt={post.title} className="mt-8 w-full rounded-2xl object-cover" />
      )}
      <div className="prose mt-8 max-w-none leading-relaxed whitespace-pre-line text-slate-800">{post.content}</div>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <Link href="/blog" className="btn-secondary">← Barcha maqolalar</Link>
      </div>
    </article>
  );
}
