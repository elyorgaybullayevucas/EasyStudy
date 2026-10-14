import Link from "next/link";

import { EyeIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import type { PostListItem } from "@/lib/types";

export function PostCard({ post }: { post: PostListItem }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      {post.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverUrl} alt={post.title} className="aspect-[2/1] w-full object-cover" />
      ) : (
        <div className="flex aspect-[2/1] items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 p-6 text-center text-lg font-semibold text-white/90">
          {post.title}
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {post.category && <span className="badge bg-brand-50 text-brand-700">{post.category.name}</span>}
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 font-semibold group-hover:text-brand-700">{post.title}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <Avatar name={post.author.fullName} url={post.author.avatarUrl} size={24} />
            {post.author.fullName}
          </span>
          <span className="flex items-center gap-1"><EyeIcon width={14} height={14} />{post.views}</span>
        </div>
      </div>
    </Link>
  );
}

export function Avatar({ name, url, size = 40, className = "" }: { name: string; url: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} style={style} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span style={style} className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ${className}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
