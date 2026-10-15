import type { AttemptStatus, CategoryGroup, CourseLevel, QuestionType, UserRole } from "./types";

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
  ESSAY: "Esse (qo'lda tekshiriladi)",
};

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
