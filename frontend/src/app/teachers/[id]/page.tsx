import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseCard } from "@/components/course/CourseCard";
import { Avatar, PostCard } from "@/components/post/PostCard";
import { BookIcon, FileTextIcon, UsersIcon } from "@/components/ui/Icons";
import { serverFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { TeacherProfile } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };
const getTeacher = (id: string) => serverFetch<TeacherProfile | null>(`/api/teachers/${encodeURIComponent(id)}`, null, 10);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTeacher((await params).id);
  return t ? { title: `${t.fullName} — o'qituvchi`, description: t.headline ?? undefined } : { title: "O'qituvchi topilmadi" };
}

export default async function TeacherPage({ params }: Props) {
  const { id } = await params;
  const t = await getTeacher(id);
  if (!t) notFound();

  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="container-page flex flex-col items-start gap-6 py-12 sm:flex-row sm:items-center">
          <Avatar name={t.fullName} url={t.avatarUrl} size={96} className="ring-4 ring-white/20" />
          <div>
            <p className="text-sm text-brand-200">O&apos;qituvchi</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{t.fullName}</h1>
            {t.headline && <p className="mt-2 text-lg text-slate-300">{t.headline}</p>}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><BookIcon width={16} height={16} />{t.courses.length} ta kurs</span>
              <span className="flex items-center gap-1.5"><UsersIcon width={16} height={16} />{t.studentCount} talaba</span>
              <span className="flex items-center gap-1.5"><FileTextIcon width={16} height={16} />{t.posts.length} ta maqola</span>
              <span>Platformada {formatDate(t.createdAt)} dan</span>
            </div>
          </div>
        </div>
      </section>
      <div className="container-page space-y-14 py-10">
        {t.bio && (
          <section><h2 className="text-xl font-bold">O&apos;qituvchi haqida</h2><p className="mt-3 max-w-3xl leading-relaxed whitespace-pre-line text-slate-700">{t.bio}</p></section>
        )}
        <section>
          <h2 className="text-xl font-bold">Kurslari</h2>
          {t.courses.length === 0 ? <p className="mt-3 text-sm text-slate-500">Hozircha nashr etilgan kurs yo&apos;q.</p>
            : <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{t.courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>}
        </section>
        <section>
          <h2 className="text-xl font-bold">Maqolalari</h2>
          {t.posts.length === 0 ? <p className="mt-3 text-sm text-slate-500">Hozircha maqola yo&apos;q.</p>
            : <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{t.posts.map((p) => <PostCard key={p.id} post={p} />)}</div>}
        </section>
      </div>
    </>
  );
}
