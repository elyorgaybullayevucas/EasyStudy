package uz.easystudy.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import uz.easystudy.dto.CourseDtos.CourseListItem;

import java.time.Instant;
import java.util.List;

public final class LearningDtos {
    private LearningDtos() {}

    public record QuizProgress(Long quizId, String title, Integer bestScore, long attempts, boolean passed) {}

    public record CourseProgress(Long courseId, boolean enrolled, List<Long> completedLessonIds, int totalLessons,
                                 List<QuizProgress> quizzes, int progressPercent, boolean completed,
                                 String certificateCode, Long nextLessonId) {}

    public record MyCourse(CourseListItem course, Instant enrolledAt, Instant completedAt, int progressPercent,
                           int completedLessons, int totalLessons, Long nextLessonId, String certificateCode) {}

    public record DashboardStats(long enrolledCourses, long completedCourses, long inProgressCourses,
                                 long certificates, long completedLessons, long quizzesPassed,
                                 long examAttempts, long examsCompleted) {}

    public record CertificateOut(String code, Instant issuedAt, String studentName, String courseTitle,
                                 String courseSlug, String instructorName, long totalMinutes) {}

    // ---------- test (quiz) ----------

    public record OptionPublic(Long id, String text) {}
    public record QuestionPublic(Long id, String text, List<OptionPublic> options) {}
    public record QuizPublic(Long id, Long courseId, Long lessonId, String title, String description, int passScore,
                             List<QuestionPublic> questions) {}

    public record QuizAnswer(@NotNull Long questionId, @NotNull Long optionId) {}
    public record QuizSubmit(@NotNull List<QuizAnswer> answers) {}

    public record QuestionResult(Long questionId, Long selectedOptionId, Long correctOptionId, boolean correct) {}
    public record QuizResult(Long quizId, int score, int correctCount, int totalCount, boolean passed, int passScore,
                             List<QuestionResult> results, boolean courseCompleted, String certificateCode) {}

    // ---------- admin ----------

    public record OptionAdmin(Long id, String text, boolean correct) {}
    public record QuestionAdmin(Long id, String text, List<OptionAdmin> options) {}
    public record QuizAdmin(Long id, Long courseId, Long lessonId, String title, String description, int passScore,
                            List<QuestionAdmin> questions) {}

    public record OptionInput(@NotBlank @Size(max = 500) String text, boolean correct) {}
    public record QuestionInput(@NotBlank String text, @NotEmpty @Size(min = 2, max = 8) List<OptionInput> options) {}
    public record QuizUpsert(@NotBlank @Size(max = 200) String title, String description,
                             @Min(1) @Max(100) int passScore, Long lessonId,
                             @NotEmpty List<QuestionInput> questions) {}

    public record AdminStats(long users, long courses, long publishedCourses, long enrollments, long certificates,
                             long exams, long examAttempts) {}

    public record ProfileUpdate(@NotBlank @Size(min = 2, max = 255) String fullName,
                                @Size(max = 160) String headline, @Size(max = 4000) String bio,
                                @Size(max = 500) String avatarUrl) {}
    public record PasswordChange(@NotBlank String currentPassword, @NotBlank @Size(min = 10, max = 128) String newPassword) {}
    public record RoleUpdate(@NotNull uz.easystudy.domain.Role role) {}
}
