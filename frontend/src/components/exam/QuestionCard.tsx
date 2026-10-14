"use client";

import { cn } from "@/lib/format";
import type { AnswerResponse, QuestionView } from "@/lib/types";

type Props = { q: QuestionView; value: AnswerResponse | undefined; onChange: (r: AnswerResponse) => void; disabled?: boolean };

export function QuestionCard({ q, value, onChange, disabled }: Props) {
  const opts = q.options ?? [];
  const optionClass = (selected: boolean) =>
    cn("flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition",
      selected ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50");

  return (
    <div className="card p-6" id={`q-${q.id}`}>
      {q.passage && <div className="mb-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{q.passage}</div>}
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{q.orderIndex}</span>
        <p className="font-medium">{q.prompt}</p>
      </div>

      {(q.type === "SINGLE_CHOICE" || q.type === "TRUE_FALSE_NG") && (
        <div className="space-y-2">
          {opts.map((o) => (
            <label key={o.key} className={optionClass(value?.value === o.key)}>
              <input type="radio" name={`q${q.id}`} className="accent-brand-600" disabled={disabled} checked={value?.value === o.key} onChange={() => onChange({ value: o.key })} />
              <span><b>{o.key}.</b> {o.text}</span>
            </label>
          ))}
        </div>
      )}

      {(q.type === "MULTI_CHOICE" || q.type === "MATCHING") && (
        <div className="space-y-2">
          {opts.map((o) => {
            const set = new Set(value?.values ?? []);
            return (
              <label key={o.key} className={optionClass(set.has(o.key))}>
                <input type="checkbox" className="accent-brand-600" disabled={disabled} checked={set.has(o.key)}
                  onChange={(e) => { if (e.target.checked) set.add(o.key); else set.delete(o.key); onChange({ values: [...set] }); }} />
                <span><b>{o.key}.</b> {o.text}</span>
              </label>
            );
          })}
        </div>
      )}

      {q.type === "GAP_FILL" && (
        <input className="input max-w-md" disabled={disabled} value={value?.value ?? ""} placeholder="Javobingiz" onChange={(e) => onChange({ value: e.target.value })} />
      )}

      {q.type === "ESSAY" && (
        <>
          <textarea className="input h-56" disabled={disabled} value={value?.text ?? ""} placeholder="Esse matni..." onChange={(e) => onChange({ text: e.target.value })} />
          <p className="mt-1 text-xs text-slate-500">{(value?.text ?? "").trim().split(/\s+/).filter(Boolean).length} so&apos;z</p>
        </>
      )}
    </div>
  );
}
