"use client";

import type { AnswerResponse, QuestionView } from "@/lib/api";

type Props = {
  q: QuestionView;
  value: AnswerResponse | undefined;
  onChange: (r: AnswerResponse) => void;
  disabled?: boolean;
};

export default function QuestionCard({ q, value, onChange, disabled }: Props) {
  const opts = q.options ?? [];

  return (
    <div className="rounded-lg border bg-white p-4">
      {q.passage && (
        <div className="mb-3 whitespace-pre-wrap rounded bg-slate-50 p-3 text-sm text-slate-700">{q.passage}</div>
      )}
      <div className="mb-3 font-medium">
        {q.orderIndex}. {q.prompt}
      </div>

      {(q.type === "SINGLE_CHOICE" || q.type === "TRUE_FALSE_NG") && (
        <div className="space-y-2">
          {opts.map((o) => (
            <label key={o.key} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name={`q${q.id}`} disabled={disabled} checked={value?.value === o.key}
                     onChange={() => onChange({ value: o.key })} />
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
              <label key={o.key} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" disabled={disabled} checked={set.has(o.key)}
                       onChange={(e) => {
                         e.target.checked ? set.add(o.key) : set.delete(o.key);
                         onChange({ values: [...set] });
                       }} />
                <span><b>{o.key}.</b> {o.text}</span>
              </label>
            );
          })}
        </div>
      )}

      {q.type === "GAP_FILL" && (
        <input className="w-full max-w-md rounded border p-2" disabled={disabled} value={value?.value ?? ""}
               placeholder="Javobingiz" onChange={(e) => onChange({ value: e.target.value })} />
      )}

      {q.type === "ESSAY" && (
        <textarea className="h-48 w-full rounded border p-2" disabled={disabled} value={value?.text ?? ""}
                  placeholder="Esse matni..." onChange={(e) => onChange({ text: e.target.value })} />
      )}
    </div>
  );
}
