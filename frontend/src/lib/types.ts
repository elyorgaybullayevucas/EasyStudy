export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  courseCount: number;
  examCount: number;
}

export interface CategoryBrief {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

export interface InstructorBrief {
  id: number;
  fullName: string;
}

export interface LessonBrief {
  id: number;
  title: string;
  durationMinutes: number;
  position: number;
  preview: boolean;
}

export interface Lesson extends LessonBrief {
  courseId: number;
  content: string;
  videoUrl: string | null;
}

export interface QuizBrief {
  id: number;
  title: string;
  lessonId: number | null;
  passScore: number;
  questionCount: number;
}

export interface CourseListItem {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  level: CourseLevel;
  price: number;
  featured: boolean;
  published: boolean;
  category: CategoryBrief | null;
  instructor: InstructorBrief | null;
  lessonCount: number;
  totalMinutes: number;
  studentCount: number;
}

export interface CourseDetail extends CourseListItem {
  description: string;
  createdAt: string;
  updatedAt: string;
  lessons: LessonBrief[];
  quizzes: QuizBrief[];
  enrolled: boolean;
}

export interface CourseAdminDetail extends Omit<CourseDetail, "lessons" | "enrolled"> {
  lessons: Lesson[];
}

export interface QuizProgress {
  quizId: number;
  title: string;
  bestScore: number | null;
  attempts: number;
  passed: boolean;
}

export interface CourseProgress {
  courseId: number;
  enrolled: boolean;
  completedLessonIds: number[];
  totalLessons: number;
  quizzes: QuizProgress[];
  progressPercent: number;
  completed: boolean;
  certificateCode: string | null;
  nextLessonId: number | null;
}

export interface MyCourse {
  course: CourseListItem;
  enrolledAt: string;
  completedAt: string | null;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonId: number | null;
  certificateCode: string | null;
}

export interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  certificates: number;
  completedLessons: number;
  quizzesPassed: number;
  examAttempts: number;
  examsCompleted: number;
}

export interface Certificate {
  code: string;
  issuedAt: string;
  studentName: string;
  courseTitle: string;
  courseSlug: string;
  instructorName: string | null;
  totalMinutes: number;
}

export interface QuizPublic {
  id: number;
  courseId: number;
  lessonId: number | null;
  title: string;
  description: string;
  passScore: number;
  questions: { id: number; text: string; options: { id: number; text: string }[] }[];
}

export interface QuizResult {
  quizId: number;
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  passScore: number;
  results: { questionId: number; selectedOptionId: number | null; correctOptionId: number | null; correct: boolean }[];
  courseCompleted: boolean;
  certificateCode: string | null;
}

export interface QuizAdmin {
  id: number;
  courseId: number;
  lessonId: number | null;
  title: string;
  description: string;
  passScore: number;
  questions: { id: number; text: string; options: { id: number; text: string; correct: boolean }[] }[];
}

export interface AdminStats {
  users: number;
  courses: number;
  publishedCourses: number;
  enrollments: number;
  certificates: number;
  exams: number;
  examAttempts: number;
}

// ---------- mock imtihonlar ----------

export type QuestionType = "SINGLE_CHOICE" | "MULTI_CHOICE" | "GAP_FILL" | "TRUE_FALSE_NG" | "MATCHING" | "ESSAY";
export type Option = { key: string; text: string };

export interface ExamSummary {
  id: number;
  code: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  featured: boolean;
  published: boolean;
  category: CategoryBrief | null;
  totalMinutes: number;
  questionCount: number;
  attemptCount: number;
}

export interface QuestionView {
  id: number;
  orderIndex: number;
  type: QuestionType;
  prompt: string;
  passage: string | null;
  options: Option[] | null;
  points: number;
}

export interface SectionView {
  id: number;
  title: string;
  orderIndex: number;
  durationMinutes: number;
  questions: QuestionView[];
}

export interface ExamDetail {
  id: number;
  code: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  featured: boolean;
  category: CategoryBrief | null;
  sections: SectionView[];
}

export type AnswerResponse = { value?: string; values?: string[]; text?: string };
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "GRADED";

export interface AttemptView {
  id: number;
  examId: number;
  examTitle: string;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  rawScore: number | null;
  scaledScore: number | null;
  answers: Record<string, AnswerResponse>;
}

export interface AnswerResult {
  questionId: number;
  response: AnswerResponse | null;
  correct: boolean | null;
  points: number | null;
}

export interface AttemptResult {
  id: number;
  examId: number;
  examTitle: string;
  status: AttemptStatus;
  rawScore: number | null;
  maxScore: number;
  scaledScore: number | null;
  answers: AnswerResult[];
}

export interface QuestionAdminView extends QuestionView {
  accepted: string[];
}

export interface SectionAdminView {
  id: number;
  title: string;
  orderIndex: number;
  durationMinutes: number;
  audioKey: string | null;
  questions: QuestionAdminView[];
}

export interface BandRow {
  minRaw: number;
  maxRaw: number;
  scaled: number;
}

export interface ExamAdminDetail {
  id: number;
  code: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  featured: boolean;
  published: boolean;
  category: CategoryBrief | null;
  sections: SectionAdminView[];
  bands: BandRow[];
}

// ---------- maqolalar / o'qituvchilar ----------

export interface AuthorBrief {
  id: number;
  fullName: string;
  headline: string | null;
  avatarUrl: string | null;
}

export interface PostListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string | null;
  published: boolean;
  category: CategoryBrief | null;
  author: AuthorBrief;
  views: number;
  createdAt: string;
}

export interface PostDetail extends PostListItem {
  content: string;
  updatedAt: string;
}

export interface TeacherProfile {
  id: number;
  fullName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  studentCount: number;
  courses: CourseListItem[];
  posts: PostListItem[];
}
