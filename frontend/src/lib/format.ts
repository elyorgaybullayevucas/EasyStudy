import type { AttemptStatus, CategoryGroup, CourseLevel, NavigationMode, PartType, QuestionType, ScoringMode, UserRole } from "./types";

export const levelLabels: Record<CourseLevel, string> = {
  BEGINNER: "Boshlang'ich",
  INTERMEDIATE: "O'rta",
  ADVANCED: "Yuqori",
};

export const groupLabels: Record<CategoryGroup, { title: string; subtitle: string }> = {
  SCHOOL: { title: "Maktab fanlari", subtitle: "Eng muhim fanlar bo'yicha to'liq kurslar va testlar" },
  LOCAL_CERT: { title: "Mahalliy sertifikatlar", subtitle: "Milliy sertifikat, DTM va attestatsiyaga tayyorlov" },
  INTERNATIONAL: { title: "Xalqaro sertifikatlar", subtitle: "IELTS, SAT, TOPIK va boshqalar" },
  OTHER: { title: "Boshqa yo'nalishlar", subtitle: "Dasturlash, kasbiy ko'nikmalar" },
};
export const groupOrder: CategoryGroup[] = ["SCHOOL", "LOCAL_CERT", "INTERNATIONAL", "OTHER"];

export const roleLabels: Record<UserRole, string> = {
  STUDENT: "Talaba",
  TEACHER: "O'qituvchi",
  ADMIN: "Administrator",
};

export const statusLabels: Record<AttemptStatus, string> = {
  IN_PROGRESS: "Jarayonda",
  SUBMITTED: "Tekshirilmoqda",
  EXPIRED: "Vaqt tugadi",
  GRADED: "Baholandi",
};

export const questionTypeLabels: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Bitta javob",
  MULTI_CHOICE: "Bir nechta javob",
  GAP_FILL: "Bo'sh joyni to'ldirish",
  TRUE_FALSE_NG: "True / False / Not Given",
  MATCHING: "Moslashtirish",
  ESSAY: "Yozma javob (Writing, o'qituvchi tekshiradi)",
  SPEAKING: "Ovozli javob (Speaking, o'qituvchi tekshiradi)",
};

export const partTypeLabels: Record<PartType, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  MATH: "Matematika",
  GENERAL: "Umumiy",
};

export const scoringModeLabels: Record<ScoringMode, string> = {
  TOTAL: "Umumiy ball (jadval bo'yicha)",
  SECTION_AVERAGE: "Bo'limlar o'rtachasi (IELTS, CEFR)",
  SECTION_SUM: "Bo'limlar yig'indisi (SAT)",
};

export const navigationModeLabels: Record<NavigationMode, string> = {
  SEQUENTIAL: "Ketma-ket bo'limlar, har birining taymeri (IELTS, SAT, TOPIK)",
  FREE: "Barcha bo'limlar bir vaqtda, yagona taymer (DTM, Attestatsiya)",
};

/** IELTS Test Report Form'dagi CEFR mosligi. */
export const ieltsCefr = (band: number | null | undefined) =>
  band == null ? null : band >= 8.5 ? "C2" : band >= 7 ? "C1" : band >= 5.5 ? "B2" : band >= 4 ? "B1" : "A2";

export const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} daq`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} soat ${m} daq` : `${h} soat`;
}

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatPrice(price: number): string {
  return price === 0 ? "Bepul" : `${price.toLocaleString("ru-RU").replace(/,/g, " ")} so'm`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Faqat sayt ichidagi manzillarga qaytaramiz (open redirect'dan himoya). */
export function safeNext(value: string | null, fallback = "/dashboard"): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
