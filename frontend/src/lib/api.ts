import type {
  AdminStats, AnswerResponse, AttemptResult, AttemptView, BandRow, Category, Certificate, CourseAdminDetail,
  CourseDetail, CourseListItem, CourseProgress, DashboardStats, ExamAdminDetail, ExamDetail, ExamSummary,
  GradingAttempt, GradingRow, Lesson, MyCourse, Page, PartType, PostDetail, PostListItem, QuestionType, QuizAdmin,
  QuizPublic, QuizResult, ScoringMode, TeacherProfile, TemplateInfo, TokenResponse, User, UserRole,
  NavigationMode,
  Subject,
  PlacementDto,
  ModuleBrief,
  SubjectOverview,
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Access token faqat xotirada (localStorage emas: XSS orqali o'g'irlanmasin).
 * Refresh token HttpOnly cookie'da; 401 bo'lsa bir marta /auth/refresh chaqiriladi.
 */
let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (t: string | null) => {
    accessToken = t;
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/api/auth/refresh`, { method: "POST", credentials: "include" })
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

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function request<T>(path: string, { body, headers, ...init }: RequestOptions = {}, retry = true): Promise<T> {
  const h: Record<string, string> = { ...(headers as Record<string, string>) };
  if (body !== undefined) h["Content-Type"] = "application/json";
  if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: h,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.");
  }

  if (res.status === 401 && retry && !path.startsWith("/api/auth/")) {
    if (await tryRefresh()) return request<T>(path, { body, headers, ...init }, false);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:expired"));
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = (data as { detail?: string } | null)?.detail;
    throw new ApiError(res.status, detail ?? (res.status >= 500 ? "Serverda xatolik yuz berdi" : "So'rovni bajarib bo'lmadi"));
  }
  return data as T;
}

/** Server komponentlar uchun: xatolikda `fallback` qaytaradi, sahifa yiqilmaydi. */
export async function serverFetch<T>(path: string, fallback: T, revalidate = 30): Promise<T> {
  try {
    const res = await fetch(`${process.env.API_URL_INTERNAL ?? API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
};

export const api = {
  auth: {
    register: (data: { fullName: string; email: string; password: string }) =>
      request<TokenResponse>("/api/auth/register", { method: "POST", body: data }),
    login: (data: { email: string; password: string }) =>
      request<TokenResponse>("/api/auth/login", { method: "POST", body: data }),
    logout: () => request<void>("/api/auth/logout", { method: "POST" }),
    me: () => request<User>("/api/auth/me"),
  },
  me: {
    update: (data: { fullName: string; headline?: string; bio?: string; avatarUrl?: string }) =>
      request<User>("/api/me", { method: "PATCH", body: data }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<void>("/api/me/password", { method: "POST", body: data }),
    courses: () => request<MyCourse[]>("/api/me/courses"),
    dashboard: () => request<DashboardStats>("/api/me/dashboard"),
    certificates: () => request<Certificate[]>("/api/me/certificates"),
  },
  categories: { list: () => request<Category[]>("/api/categories") },
  courses: {
    list: (params: Record<string, string | number | undefined> = {}) => request<Page<CourseListItem>>(`/api/courses${qs(params)}`),
    get: (slug: string) => request<CourseDetail>(`/api/courses/${encodeURIComponent(slug)}`),
    enroll: (slug: string) => request<CourseProgress>(`/api/courses/${encodeURIComponent(slug)}/enroll`, { method: "POST" }),
    progress: (slug: string) => request<CourseProgress>(`/api/courses/${encodeURIComponent(slug)}/progress`),
    lesson: (slug: string, lessonId: number) => request<Lesson>(`/api/courses/${encodeURIComponent(slug)}/lessons/${lessonId}`),
  },
  subjects: {
    list: () => request<Subject[]>("/api/subjects"),
    get: (slug: string) => request<Subject>(`/api/subjects/${encodeURIComponent(slug)}`),
    myPlacements: () => request<PlacementDto[]>("/api/subjects/my-placements"),
  },
  learning: {
    completeLesson: (id: number) => request<CourseProgress>(`/api/lessons/${id}/complete`, { method: "POST" }),
    uncompleteLesson: (id: number) => request<CourseProgress>(`/api/lessons/${id}/complete`, { method: "DELETE" }),
    quiz: (id: number) => request<QuizPublic>(`/api/quizzes/${id}`),
    submitQuiz: (id: number, answers: { questionId: number; optionId: number }[]) =>
      request<QuizResult>(`/api/quizzes/${id}/submit`, { method: "POST", body: { answers } }),
  },
  certificates: { verify: (code: string) => request<Certificate>(`/api/certificates/${encodeURIComponent(code)}`) },
  exams: {
    list: (params: { category?: string; featured?: boolean } = {}) => request<ExamSummary[]>(`/api/exams${qs(params)}`),
    get: (id: number | string) => request<ExamDetail>(`/api/exams/${id}`),
  },
  attempts: {
    start: (examId: number) => request<AttemptView>("/api/attempts", { method: "POST", body: { examId } }),
    get: (id: number | string) => request<AttemptView>(`/api/attempts/${id}`),
    mine: () => request<AttemptView[]>("/api/attempts"),
    startSection: (id: number | string, sectionId: number) => request<AttemptView>(`/api/attempts/${id}/sections/${sectionId}/start`, { method: "POST" }),
    finishSection: (id: number | string, sectionId: number) => request<AttemptView>(`/api/attempts/${id}/sections/${sectionId}/finish`, { method: "POST" }),
    answer: (id: number | string, questionId: number, response: AnswerResponse) =>
      request<void>(`/api/attempts/${id}/answers`, { method: "PUT", body: { questionId, response } }),
    audioAnswer: (id: number | string, questionId: number, blob: Blob, onProgress?: (p: number) => void) =>
      uploadForm(`/api/attempts/${id}/answers/audio`, (fd) => { fd.append("questionId", String(questionId)); fd.append("file", blob, "answer.webm"); }, onProgress) as Promise<{ audioKey: string; audioUrl: string }>,
    submit: (id: number | string) => request<AttemptResult>(`/api/attempts/${id}/submit`, { method: "POST" }),
    result: (id: number | string) => request<AttemptResult>(`/api/attempts/${id}/result`),
  },
  posts: {
    list: (params: Record<string, string | number | undefined> = {}) => request<Page<PostListItem>>(`/api/posts${qs(params)}`),
    get: (slug: string) => request<PostDetail>(`/api/posts/${encodeURIComponent(slug)}`),
  },
  teachers: { get: (id: number | string) => request<TeacherProfile>(`/api/teachers/${id}`) },
  admin: {
    stats: () => request<AdminStats>("/api/admin/stats"),
    courses: (params: { search?: string; page?: number } = {}) => request<Page<CourseListItem>>(`/api/admin/courses${qs({ ...params, size: 50 })}`),
    course: (id: number) => request<CourseAdminDetail>(`/api/admin/courses/${id}`),
    createCourse: (data: CourseInput) => request<CourseAdminDetail>("/api/admin/courses", { method: "POST", body: data }),
    updateCourse: (id: number, data: CourseInput) => request<CourseAdminDetail>(`/api/admin/courses/${id}`, { method: "PUT", body: data }),
    deleteCourse: (id: number) => request<void>(`/api/admin/courses/${id}`, { method: "DELETE" }),
    createLesson: (courseId: number, data: LessonInput) => request<Lesson>(`/api/admin/courses/${courseId}/lessons`, { method: "POST", body: data }),
    updateLesson: (id: number, data: LessonInput) => request<Lesson>(`/api/admin/lessons/${id}`, { method: "PUT", body: data }),
    deleteLesson: (id: number) => request<void>(`/api/admin/lessons/${id}`, { method: "DELETE" }),
    createModule: (courseId: number, data: ModuleInput) => request<ModuleBrief>(`/api/admin/courses/${courseId}/modules`, { method: "POST", body: data }),
    updateModule: (id: number, data: ModuleInput) => request<ModuleBrief>(`/api/admin/modules/${id}`, { method: "PUT", body: data }),
    deleteModule: (id: number) => request<void>(`/api/admin/modules/${id}`, { method: "DELETE" }),
    mySubjects: () => request<Category[]>("/api/admin/subjects"),
    subjectOverview: (slug: string) => request<SubjectOverview>(`/api/admin/subjects/${encodeURIComponent(slug)}/overview`),
    teachers: () => request<User[]>("/api/admin/teachers"),
    setUserSubjects: (userId: number, categoryIds: number[]) => request<Category[]>(`/api/admin/users/${userId}/subjects`, { method: "PUT", body: { categoryIds } }),
    setCategoryTeachers: (id: number, userIds: number[]) => request<Category>(`/api/admin/categories/${id}/teachers`, { method: "PUT", body: { userIds } }),
    updateCategory: (id: number, data: CategoryInput) => request<Category>(`/api/admin/categories/${id}`, { method: "PUT", body: data }),
    quiz: (id: number) => request<QuizAdmin>(`/api/admin/quizzes/${id}`),
    createQuiz: (courseId: number, data: QuizInput) => request<QuizAdmin>(`/api/admin/courses/${courseId}/quizzes`, { method: "POST", body: data }),
    updateQuiz: (id: number, data: QuizInput) => request<QuizAdmin>(`/api/admin/quizzes/${id}`, { method: "PUT", body: data }),
    deleteQuiz: (id: number) => request<void>(`/api/admin/quizzes/${id}`, { method: "DELETE" }),
    categories: () => request<Category[]>("/api/admin/categories"),
    createCategory: (data: CategoryInput) => request<Category>("/api/admin/categories", { method: "POST", body: data }),
    deleteCategory: (id: number) => request<void>(`/api/admin/categories/${id}`, { method: "DELETE" }),
    users: (params: { search?: string; page?: number } = {}) => request<Page<User>>(`/api/admin/users${qs({ ...params, size: 50 })}`),
    setRole: (id: number, role: UserRole) => request<User>(`/api/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
    // mock imtihonlar
    exams: () => request<ExamSummary[]>("/api/admin/exams"),
    examTemplates: () => request<TemplateInfo[]>("/api/admin/exams/templates"),
    exam: (id: number) => request<ExamAdminDetail>(`/api/admin/exams/${id}`),
    createExam: (data: ExamInput) => request<ExamAdminDetail>("/api/admin/exams", { method: "POST", body: data }),
    createExamFromTemplate: (code: string, data: ExamInput) => request<ExamAdminDetail>(`/api/admin/exams/from-template/${code}`, { method: "POST", body: data }),
    updateExam: (id: number, data: ExamInput) => request<ExamAdminDetail>(`/api/admin/exams/${id}`, { method: "PUT", body: data }),
    deleteExam: (id: number) => request<void>(`/api/admin/exams/${id}`, { method: "DELETE" }),
    setBands: (id: number, bands: BandRow[]) => request<ExamAdminDetail>(`/api/admin/exams/${id}/bands`, { method: "PUT", body: { bands } }),
    setSectionBands: (sectionId: number, bands: BandRow[]) => request<void>(`/api/admin/exams/sections/${sectionId}/bands`, { method: "PUT", body: { bands } }),
    addSection: (examId: number, data: SectionInput) => request<{ id: number }>(`/api/admin/exams/${examId}/sections`, { method: "POST", body: data }),
    updateSection: (id: number, data: SectionInput) => request<void>(`/api/admin/exams/sections/${id}`, { method: "PUT", body: data }),
    deleteSection: (id: number) => request<void>(`/api/admin/exams/sections/${id}`, { method: "DELETE" }),
    // tekshirish navbati
    grading: (all = false) => request<GradingRow[]>(`/api/admin/grading${qs({ all })}`),
    aiStatus: () => request<string[]>("/api/admin/grading/ai-status"),
    gradingAttempt: (attemptId: number) => request<GradingAttempt>(`/api/admin/grading/${attemptId}`),
    grade: (attemptId: number, items: { questionId: number; points: number; feedback?: string }[]) =>
      request<GradingAttempt>(`/api/admin/grading/${attemptId}`, { method: "POST", body: { items } }),
    addQuestion: (sectionId: number, data: ExamQuestionInput) => request<{ id: number }>(`/api/admin/exams/sections/${sectionId}/questions`, { method: "POST", body: data }),
    updateQuestion: (id: number, data: ExamQuestionInput) => request<void>(`/api/admin/exams/questions/${id}`, { method: "PUT", body: data }),
    deleteQuestion: (id: number) => request<void>(`/api/admin/exams/questions/${id}`, { method: "DELETE" }),
    // maqolalar
    posts: (params: { search?: string } = {}) => request<Page<PostListItem>>(`/api/admin/posts${qs({ ...params, size: 50 })}`),
    post: (id: number) => request<PostDetail>(`/api/admin/posts/${id}`),
    createPost: (data: PostInput) => request<PostDetail>("/api/admin/posts", { method: "POST", body: data }),
    updatePost: (id: number, data: PostInput) => request<PostDetail>(`/api/admin/posts/${id}`, { method: "PUT", body: data }),
    deletePost: (id: number) => request<void>(`/api/admin/posts/${id}`, { method: "DELETE" }),
  },
};

export interface CourseInput {
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string | null;
  level: string;
  price: number;
  categoryId: number | null;
  published: boolean;
  featured: boolean;
  finalExamId?: number | null;
  stage?: number | null;
  minPlacementScore?: number | null;
  sequential?: boolean;
}

export interface LessonInput {
  title: string;
  content: string;
  videoUrl: string | null;
  videoKey: string | null;
  durationMinutes: number;
  position?: number | null;
  preview: boolean;
  examId?: number | null;
  moduleId?: number | null;
}

export type MediaKind = "VIDEO" | "AUDIO" | "IMAGE";
export interface MediaUploadResult { key: string; size: number; contentType: string; previewUrl: string }

/** Fayl yuklash (progress bilan). Access token eskirgan bo'lsa avval yangilanadi. */
export async function uploadMedia(file: File, kind: MediaKind, onProgress?: (pct: number) => void): Promise<MediaUploadResult> {
  if (!tokenStore.get()) await tryRefresh();
  const attempt = () =>
    new Promise<MediaUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/api/admin/media`);
      xhr.withCredentials = true;
      const t = tokenStore.get();
      if (t) xhr.setRequestHeader("Authorization", `Bearer ${t}`);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        let data: unknown = null;
        try { data = JSON.parse(xhr.responseText); } catch { /* bo'sh */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data as MediaUploadResult);
        else reject(new ApiError(xhr.status, (data as { detail?: string } | null)?.detail ?? (xhr.status === 413 ? "Fayl juda katta" : "Yuklashda xatolik")));
      };
      xhr.onerror = () => reject(new ApiError(0, "Serverga ulanib bo'lmadi"));
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      xhr.send(fd);
    });
  try {
    return await attempt();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && (await tryRefresh())) return attempt();
    throw e;
  }
}

export interface QuizInput {
  title: string;
  description: string;
  passScore: number;
  lessonId: number | null;
  questions: { text: string; options: { text: string; correct: boolean }[] }[];
}

export interface ExamInput {
  code: string;
  title: string;
  description: string;
  level: string;
  featured: boolean;
  published: boolean;
  categoryId: number | null;
  scoringMode?: ScoringMode | null;
  navigationMode?: NavigationMode | null;
  instructions?: string | null;
}

export interface ModuleInput {
  title: string;
  description?: string;
  position?: number | null;
  examId?: number | null;
}

export interface CategoryInput {
  name: string;
  description?: string;
  icon?: string;
  group: string;
  position?: number;
  placementExamId?: number | null;
  certSlugs?: string;
}

export interface SectionInput {
  title: string;
  partType: PartType;
  orderIndex: number;
  durationMinutes: number;
  instructions?: string | null;
  defaultPoints?: number | null;
  audioKey?: string | null;
}

export interface ExamQuestionInput {
  orderIndex: number;
  type: QuestionType;
  prompt: string;
  passage: string | null;
  options: { key: string; text: string }[] | null;
  accepted: string[];
  points: number;
  weight?: number | null;
  imageKey?: string | null;
  minWords?: number | null;
  prepSeconds?: number | null;
  answerSeconds?: number | null;
}

/** Multipart yuklash (progress bilan); 401 bo'lsa token yangilanib qayta uriniladi. */
export async function uploadForm(path: string, fill: (fd: FormData) => void, onProgress?: (pct: number) => void): Promise<unknown> {
  if (!tokenStore.get()) await tryRefresh();
  const attempt = () =>
    new Promise<unknown>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}${path}`);
      xhr.withCredentials = true;
      const t = tokenStore.get();
      if (t) xhr.setRequestHeader("Authorization", `Bearer ${t}`);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        let data: unknown = null;
        try { data = JSON.parse(xhr.responseText); } catch { /* bo'sh */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new ApiError(xhr.status, (data as { detail?: string } | null)?.detail ?? (xhr.status === 413 ? "Fayl juda katta" : "Yuklashda xatolik")));
      };
      xhr.onerror = () => reject(new ApiError(0, "Serverga ulanib bo'lmadi"));
      const fd = new FormData();
      fill(fd);
      xhr.send(fd);
    });
  try {
    return await attempt();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && (await tryRefresh())) return attempt();
    throw e;
  }
}

export interface PostInput {
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string | null;
  categoryId: number | null;
  published: boolean;
}
