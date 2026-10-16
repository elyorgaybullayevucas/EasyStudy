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

export type CategoryGroup = "SCHOOL" | "LOCAL_CERT" | "INTERNATIONAL" | "OTHER";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  group: CategoryGroup;
  position: number;
  courseCount: number;
  examCount: number;
}

export interface CategoryBrief {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  group: CategoryGroup;
}

export interface InstructorBrief {
  id: number;
  fullName: string;
}

export interface ExamBrief {
  id: number;
  title: string;
  totalMinutes: number;
  questionCount: number;
}

export interface LessonBrief {
  id: number;
  title: string;
  durationMinutes: number;
  position: number;
  preview: boolean;
  /** Darsga bog'langan mavzu mock'i (bo'lim mashqi) */
  exam: ExamBrief | null;
}

export interface Lesson extends LessonBrief {
  courseId: number;
  content: string;
  /** PLATFORM bo'lsa vaqtli imzolangan havola (bir necha soat amal qiladi), EXTERNAL bo'lsa tashqi havola */
  videoUrl: string | null;
  videoSource: "PLATFORM" | "EXTERNAL" | null;
  videoKey: string | null;
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
  finalExam: ExamBrief | null;
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

export type QuestionType = "SINGLE_CHOICE" | "MULTI_CHOICE" | "GAP_FILL" | "TRUE_FALSE_NG" | "MATCHING" | "ESSAY" | "SPEAKING";
export type PartType = "LISTENING" | "READING" | "WRITING" | "SPEAKING" | "MATH" | "GENERAL";
export type ScoringMode = "TOTAL" | "SECTION_AVERAGE" | "SECTION_SUM";
/** SEQUENTIAL: bo'limlar ketma-ket, har birining taymeri (IELTS). FREE: hammasi bir vaqtda, yagona taymer (DTM). */
export type NavigationMode = "SEQUENTIAL" | "FREE";
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
  templateCode: string | null;
  scoringMode: ScoringMode;
  navigationMode: NavigationMode;
  parts: string[];
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
  imageUrl: string | null;
  minWords: number | null;
  prepSeconds: number | null;
  answerSeconds: number | null;
}

export interface SectionView {
  id: number;
  title: string;
  partType: PartType;
  orderIndex: number;
  durationMinutes: number;
  instructions: string | null;
  audioUrl: string | null;
  manual: boolean;
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
  templateCode: string | null;
  scoringMode: ScoringMode;
  navigationMode: NavigationMode;
  instructions: string | null;
  sections: SectionView[];
}

export type AnswerResponse = { value?: string; values?: string[]; text?: string; audioKey?: string; audioUrl?: string };
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "GRADED";
export type SectionStatus = "LOCKED" | "OPEN" | "FINISHED";

export interface SectionState {
  sectionId: number;
  title: string;
  partType: PartType;
  orderIndex: number;
  durationMinutes: number;
  questionCount: number;
  startedAt: string | null;
  endsAt: string | null;
  finishedAt: string | null;
  status: SectionStatus;
}

export interface AttemptView {
  id: number;
  examId: number;
  examTitle: string;
  scoringMode: ScoringMode;
  navigationMode: NavigationMode;
  templateCode: string | null;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  rawScore: number | null;
  scaledScore: number | null;
  sections: SectionState[];
  currentSectionId: number | null;
  answers: Record<string, AnswerResponse>;
}

export type AiStatus = "NONE" | "PENDING" | "DONE" | "FAILED";

export interface AnswerResult {
  questionId: number;
  sectionId: number;
  type: QuestionType;
  response: AnswerResponse | null;
  correct: boolean | null;
  points: number | null;
  maxPoints: number;
  feedback: string | null;
  audioUrl: string | null;
  pending: boolean;
  aiGraded: boolean;
}

export interface SectionResult {
  sectionId: number;
  title: string;
  partType: PartType;
  rawScore: number | null;
  maxScore: number | null;
  scaledScore: number | null;
  pending: boolean;
  questionCount: number;
  correctCount: number;
  pointsPerQuestion: number;
}

export interface AttemptResult {
  id: number;
  examId: number;
  examTitle: string;
  scoringMode: ScoringMode;
  templateCode: string | null;
  status: AttemptStatus;
  submittedAt: string | null;
  studentName: string;
  rawScore: number | null;
  maxScore: number;
  scaledScore: number | null;
  label: string | null;
  pendingCount: number;
  aiStatus: AiStatus;
  sections: SectionResult[];
  answers: AnswerResult[];
}

export interface QuestionAdminView extends QuestionView {
  accepted: string[];
  weight: number;
  imageKey: string | null;
}

export interface BandRow {
  minRaw: number;
  maxRaw: number;
  scaled: number;
  label?: string | null;
}

export interface SectionAdminView {
  id: number;
  title: string;
  partType: PartType;
  orderIndex: number;
  durationMinutes: number;
  instructions: string | null;
  defaultPoints: number;
  audioKey: string | null;
  audioUrl: string | null;
  bands: BandRow[];
  questions: QuestionAdminView[];
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
  ownerId: number | null;
  ownerName: string | null;
  templateCode: string | null;
  scoringMode: ScoringMode;
  navigationMode: NavigationMode;
  instructions: string | null;
  sections: SectionAdminView[];
  bands: BandRow[];
}

export interface TemplateSection {
  title: string;
  partType: PartType;
  durationMinutes: number;
  defaultPoints: number;
  questionCount: number;
  questionTypes: string;
  instructions: string;
  manual: boolean;
}

export interface TemplateInfo {
  code: string;
  title: string;
  group: CategoryGroup | "PRACTICE";
  description: string;
  scoringMode: ScoringMode;
  navigationMode: NavigationMode;
  scoringNote: string;
  totalMinutes: number;
  sections: TemplateSection[];
}

export interface GradingRow {
  attemptId: number;
  examId: number;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string | null;
  status: AttemptStatus;
  pendingCount: number;
  aiGraded: boolean;
  aiStatus: AiStatus;
}

export interface GradingQuestion {
  questionId: number;
  sectionId: number;
  sectionTitle: string;
  type: QuestionType;
  prompt: string;
  maxPoints: number;
  response: AnswerResponse | null;
  audioUrl: string | null;
  points: number | null;
  feedback: string | null;
  aiGraded: boolean;
  transcript: string | null;
}

export interface GradingAttempt {
  summary: GradingRow;
  questions: GradingQuestion[];
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
