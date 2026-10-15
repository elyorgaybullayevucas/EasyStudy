import Link from "next/link";

import { FileTextIcon, TimerIcon, UsersIcon } from "@/components/ui/Icons";
import { levelLabels } from "@/lib/format";
import type { ExamSummary } from "@/lib/types";

const tones = ["from-rose-500 to-orange-600", "from-brand-600 to-indigo-700", "from-emerald-500 to-teal-700", "from-violet-500 to-purple-700"];

export function ExamCard({ exam }: { exam: ExamSummary }) {
  return (
    <Link href={`/exams/${exam.id}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`relative flex h-28 items-end bg-gradient-to-br p-5 text-white ${tones[exam.id % tones.length]}`}>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <span className="font-mono text-xs tracking-wider text-white/80">{exam.code}</span>
        {exam.featured && <span className="badge absolute top-4 right-4 bg-white/20 text-white">Tavsiya</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          {exam.category && <span className="badge bg-brand-50 text-brand-700">{exam.category.name}</span>}
          <span className="badge bg-slate-100 text-slate-600">{levelLabels[exam.level]}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 font-semibold group-hover:text-brand-700">{exam.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{exam.description}</p>
        {exam.parts?.length > 0 && <p className="mt-2 truncate text-xs text-slate-500">{exam.parts.join(" · ")}</p>}
        <div className="mt-auto flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><TimerIcon width={14} height={14} />{exam.totalMinutes} daq</span>
          <span className="flex items-center gap-1"><FileTextIcon width={14} height={14} />{exam.questionCount} savol</span>
          <span className="flex items-center gap-1"><UsersIcon width={14} height={14} />{exam.attemptCount} urinish</span>
        </div>
      </div>
    </Link>
  );
}
