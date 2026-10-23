"use client";

import katex from "katex";
import { useMemo } from "react";

import { cn } from "@/lib/format";

/**
 * Dars matni / savol matni: $...$ (satr ichi) va $$...$$ (alohida qator) formulalar KaTeX bilan,
 * oddiy belgilash: "## sarlavha", "**qalin**", "- ro'yxat", "1) ...". HTML kiritilmaydi (xavfsiz).
 */
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderInline(text: string): string {
  // $...$ formulalarni ajratib olamiz; qolgan matn escape qilinadi va **qalin** qo'llanadi
  const parts = text.split(/(\$[^$\n]+?\$)/g);
  return parts.map((p) => {
    if (p.length > 2 && p.startsWith("$") && p.endsWith("$")) {
      try { return katex.renderToString(p.slice(1, -1), { throwOnError: false, displayMode: false }); } catch { return escapeHtml(p); }
    }
    return escapeHtml(p).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }).join("");
}

export function renderMathHtml(src: string): string {
  const blocks = src.split(/(\$\$[\s\S]+?\$\$)/g);
  const out: string[] = [];
  for (const b of blocks) {
    if (b.startsWith("$$") && b.endsWith("$$")) {
      try { out.push(`<div class="my-3 overflow-x-auto">${katex.renderToString(b.slice(2, -2), { throwOnError: false, displayMode: true })}</div>`); } catch { out.push(escapeHtml(b)); }
      continue;
    }
    let listOpen = false;
    for (const rawLine of b.split("\n")) {
      const line = rawLine.trimEnd();
      if (listOpen && !/^\s*[-•]\s+/.test(line)) { out.push("</ul>"); listOpen = false; }
      if (!line.trim()) { out.push('<div class="h-2"></div>'); continue; }
      if (line.startsWith("### ")) out.push(`<h4 class="mt-4 mb-1 font-semibold">${renderInline(line.slice(4))}</h4>`);
      else if (line.startsWith("## ")) out.push(`<h3 class="mt-5 mb-2 text-lg font-bold">${renderInline(line.slice(3))}</h3>`);
      else if (/^\s*[-•]\s+/.test(line)) { if (!listOpen) { out.push('<ul class="my-2 list-disc space-y-1 pl-6">'); listOpen = true; } out.push(`<li>${renderInline(line.replace(/^\s*[-•]\s+/, ""))}</li>`); }
      else out.push(`<p class="my-1">${renderInline(line)}</p>`);
    }
    if (listOpen) out.push("</ul>");
  }
  return out.join("");
}

/** Bir qatorli matn (savol, variant): faqat satr ichi formulalar. */
export function MathInline({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderInline(text), [text]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Ko'p qatorli matn (dars konspekti, yo'riqnoma). */
export function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderMathHtml(text), [text]);
  return <div className={cn("leading-relaxed text-slate-700", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
