"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Attempts, type AttemptView } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function MyAttemptsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<AttemptView[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return router.push("/login");
    Attempts.mine().then(setItems).catch(() => setItems([]));
  }, [user, loading, router]);

  if (!items) return <p>Yuklanmoqda...</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Natijalarim</h1>
      {items.length === 0 && <p className="text-slate-600">Hali urinishlar yo&apos;q.</p>}
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
            <div>
              <div className="font-medium">{a.examTitle}</div>
              <div className="text-xs text-slate-500">{new Date(a.startedAt).toLocaleString()} · {a.status}</div>
            </div>
            <div className="flex items-center gap-3">
              {a.scaledScore != null && <span className="font-semibold">{a.scaledScore}</span>}
              <Link href={a.status === "IN_PROGRESS" ? `/attempts/${a.id}` : `/attempts/${a.id}/result`}
                    className="rounded border px-3 py-1 text-sm">
                {a.status === "IN_PROGRESS" ? "Davom etish" : "Natija"}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
