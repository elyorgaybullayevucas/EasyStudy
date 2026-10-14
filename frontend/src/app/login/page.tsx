"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4 rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Kirish</h1>
      <input className="w-full rounded border p-2" type="email" placeholder="Email" value={email}
             onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      <input className="w-full rounded border p-2" type="password" placeholder="Parol" value={password}
             onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="w-full rounded bg-slate-900 p-2 text-white disabled:opacity-50">
        {busy ? "..." : "Kirish"}
      </button>
    </form>
  );
}
