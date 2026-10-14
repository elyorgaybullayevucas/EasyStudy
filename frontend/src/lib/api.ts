"use client";

/**
 * API mijozi.
 * - Access token faqat xotirada (localStorage emas: XSS orqali o'g'irlanmasin).
 * - Refresh token HttpOnly cookie'da; 401 bo'lsa bir marta /auth/refresh chaqiriladi.
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

export function setAccessToken(t: string | null) {
  accessToken = t;
}
export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${API}/api/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (r) => {
        if (!r.ok) return false;
        const data = (await r.json()) as TokenResponse;
        accessToken = data.accessToken;
        return true;
      })
      .catch(() => false)
      .finally(() => (refreshing = null));
  }
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${API}${path}`, { ...init, headers, credentials: "include" });

  if (res.status === 401 && retry && !path.startsWith("/api/auth/")) {
    if (await tryRefresh()) return api<T>(path, init, false);
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const p = await res.json();
      detail = p.detail ?? detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------- tiplar (backend DTO larga mos) ----------
export type UserResponse = { id: number; email: string; fullName: string | null; role: "STUDENT" | "TEACHER" | "ADMIN" };
export type TokenResponse = { accessToken: string; expiresIn: number; user: UserResponse };

export type QuestionType = "SINGLE_CHOICE" | "MULTI_CHOICE" | "GAP_FILL" | "TRUE_FALSE_NG" | "MATCHING" | "ESSAY";
export type Option = { key: string; text: string };
export type QuestionView = {
  id: number; orderIndex: number; type: QuestionType; prompt: string;
  passage: string | null; options: Option[] | null; points: number;
};
export type SectionView = { id: number; title: string; orderIndex: number; durationMinutes: number; questions: QuestionView[] };
export type ExamSummary = { id: number; code: string; title: string; description: string | null; totalMinutes: number; questionCount: number };
export type ExamDetail = { id: number; code: string; title: string; description: string | null; sections: SectionView[] };

export type AnswerResponse = { value?: string; values?: string[]; text?: string };
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "GRADED";
export type AttemptView = {
  id: number; examId: number; examTitle: string; status: AttemptStatus;
  startedAt: string; expiresAt: string; submittedAt: string | null;
  rawScore: number | null; scaledScore: number | null;
  answers: Record<string, AnswerResponse>;
};
export type AnswerResult = { questionId: number; response: AnswerResponse | null; correct: boolean | null; points: number | null };
export type AttemptResult = {
  id: number; examId: number; examTitle: string; status: AttemptStatus;
  rawScore: number | null; maxScore: number; scaledScore: number | null; answers: AnswerResult[];
};

// ---------- endpointlar ----------
export const Auth = {
  login: (email: string, password: string) =>
    api<TokenResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, fullName: string) =>
    api<TokenResponse>("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, fullName }) }),
  refresh: tryRefresh,
  logout: () => api<void>("/api/auth/logout", { method: "POST" }),
  me: () => api<UserResponse>("/api/auth/me"),
};

export const Exams = {
  list: () => api<ExamSummary[]>("/api/exams"),
  get: (id: number | string) => api<ExamDetail>(`/api/exams/${id}`),
};

export const Attempts = {
  start: (examId: number) => api<AttemptView>("/api/attempts", { method: "POST", body: JSON.stringify({ examId }) }),
  get: (id: number | string) => api<AttemptView>(`/api/attempts/${id}`),
  mine: () => api<AttemptView[]>("/api/attempts"),
  answer: (id: number | string, questionId: number, response: AnswerResponse) =>
    api<void>(`/api/attempts/${id}/answers`, { method: "PUT", body: JSON.stringify({ questionId, response }) }),
  submit: (id: number | string) => api<AttemptResult>(`/api/attempts/${id}/submit`, { method: "POST" }),
  result: (id: number | string) => api<AttemptResult>(`/api/attempts/${id}/result`),
};
