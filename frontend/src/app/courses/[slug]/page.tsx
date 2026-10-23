import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseThumb } from "@/components/course/CourseThumb";
import { EnrollPanel } from "@/components/course/EnrollPanel";
import { AwardIcon, BookIcon, ClockIcon, PlayIcon, QuizIcon, UsersIcon } from "@/components/ui/Icons";
import { serverFetch } from "@/lib/api";
import { formatDuration, levelLabels } from "@/lib/format";
import type { CourseDetail } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

const getCourse = (slug: string) => serverFetch<CourseDetail | null>(`/api/courses/${encodeURIComponent(slug)}`, null, 10);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: course.title, description: course.shortDescription } : { title: "Kurs topilmadi" };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap gap-2">
              {course.category && <span className="badge bg-brand-500/20 text-brand-200">{course.category.name}</span>}
              <span className="badge bg-white/10 text-slate-200">{levelLabels[course.level]}</span>
              {course.stage != null && <span className="badge bg-accent-500/20 text-accent-300">{course.stage}-bosqich</span>}
              {course.sequential && <span className="badge bg-white/10 text-slate-200">darslar ketma-ket ochiladi</span>}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
            <p className="mt-4 text-lg text-slate-300">{course.shortDescription}</p>
            {course.instructor && (
              <p className="mt-4 text-sm text-slate-400">
                O&apos;qituvchi: <Link href={`/teachers/${course.instructor.id}`} className="font-medium text-white hover:underline">{course.instructor.fullName}</Link>
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><BookIcon width={16} height={16} />{course.lessonCount} ta dars</span>
              <span className="flex items-center gap-1.5"><ClockIcon width={16} height={16} />{formatDuration(course.totalMinutes)}</span>
              <span className="flex items-center gap-1.5"><QuizIcon width={16} height={16} />{course.quizzes.length} ta test</span>
              <span className="flex items-center gap-1.5"><UsersIcon width={16} height={16} />{course.studentCount} talaba</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
        <div className="order-2 space-y-10 lg:order-1">
          <section>
            <h2 className="text-xl font-bold">Kurs haqida</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-700">{course.description || course.shortDescription}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold">Kurs dasturi</h2>
            <p className="mt-1 text-sm text-slate-500">{course.modules.length > 0 ? `${course.modules.length} bo'lim • ` : ""}{course.lessonCount} ta dars • {course.quizzes.filter((q) => q.lessonId != null).length} mavzu testi • {formatDuration(course.totalMinutes)}</p>
            {course.stage != null && course.category && (
              <p className="mt-2 text-sm text-slate-600">Bu {course.category.name} fanining {course.stage}-bosqichi. {course.minPlacementScore > 0 ? `Daraja testidan ${course.minPlacementScore}%+ olganlar yoki oldingi bosqichni tugatganlar uchun.` : "Boshlang'ich bosqich: hamma uchun ochiq."} <Link href={`/maktab/${course.category.slug}`} className="text-brand-700 underline">Fan sahifasi</Link></p>
            )}
            <ol className="card mt-4 divide-y divide-slate-100">
              {course.modules.map((m) => (
                <li key={`mod-${m.id}`}>
                  <p className="bg-slate-50 px-5 py-2 text-xs font-semibold tracking-wider text-slate-600 uppercase">{m.position}-bo&apos;lim: {m.title}</p>
                  <ol className="divide-y divide-slate-100">
                    {course.lessons.filter((l) => l.moduleId === m.id).map((lesson) => (
                      <li key={lesson.id} className="flex items-center gap-4 px-5 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{course.lessons.findIndex((l) => l.id === lesson.id) + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-xs text-slate-500">
                            {lesson.preview && <span className="font-medium text-accent-600">Bepul ko&apos;rish mumkin · </span>}
                            {course.quizzes.some((q) => q.lessonId === lesson.id) && <span>mavzu testi</span>}
                            {lesson.exam && <span> · mavzu mock&apos;i: {lesson.exam.title}</span>}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-sm text-slate-500"><PlayIcon width={14} height={14} /> {lesson.durationMinutes} daq</span>
                      </li>
                    ))}
                    {m.exam && (
                      <li className="flex items-center gap-4 bg-violet-50/60 px-5 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><QuizIcon width={16} height={16} /></span>
                        <div className="flex-1"><p className="font-medium">Bo&apos;lim mock&apos;i: {m.exam.title}</p><p className="text-xs text-slate-500">{m.exam.questionCount} savol • {m.exam.totalMinutes} daqiqa</p></div>
                      </li>
                    )}
                  </ol>
                </li>
              ))}
              {course.lessons.filter((l) => !l.moduleId || !course.modules.some((m) => m.id === l.moduleId)).map((lesson, i) => (
                <li key={lesson.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-xs text-slate-500">
                      {lesson.preview && <span className="font-medium text-accent-600">Bepul ko&apos;rish mumkin</span>}
                      {lesson.preview && lesson.exam && " · "}
                      {lesson.exam && <span>+ mavzu mock&apos;i: {lesson.exam.title}</span>}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm text-slate-500"><PlayIcon width={14} height={14} /> {lesson.durationMinutes} daq</span>
                </li>
              ))}
              {course.quizzes.filter((q) => q.lessonId == null).map((quiz) => (
                <li key={`q-${quiz.id}`} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"><QuizIcon width={16} height={16} /></span>
                  <div className="flex-1">
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-xs text-slate-500">{quiz.questionCount} ta savol • o&apos;tish bali {quiz.passScore}%</p>
                  </div>
                </li>
              ))}
              {course.finalExam && (
                <li className="flex items-center gap-4 bg-emerald-50/60 px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><AwardIcon width={16} height={16} /></span>
                  <div className="flex-1">
                    <p className="font-medium">Yakuniy mock imtihon: {course.finalExam.title}</p>
                    <p className="text-xs text-slate-500">{course.finalExam.totalMinutes} daqiqa • {course.finalExam.questionCount} savol / vazifa • haqiqiy format</p>
                  </div>
                  <Link href={`/exams/${course.finalExam.id}`} className="btn-secondary py-1.5">Ko&apos;rish</Link>
                </li>
              )}
            </ol>
          </section>
          <section className="card flex items-start gap-4 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-600"><AwardIcon /></span>
            <div>
              <h3 className="font-semibold">Kurs yakunida sertifikat</h3>
              <p className="mt-1 text-sm text-slate-600">Barcha darslarni tugatib, testlardan o&apos;tsangiz, noyob raqamli va onlayn tekshiriladigan sertifikat olasiz.</p>
            </div>
          </section>
        </div>
        <aside className="order-1 lg:order-2 lg:-mt-64">
          <div className="card sticky top-24 overflow-hidden">
            <CourseThumb id={course.id} title={course.title} url={course.thumbnailUrl} icon={course.category?.icon} />
            <EnrollPanel course={course} />
          </div>
        </aside>
      </div>
    </>
  );
}
