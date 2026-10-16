package uz.easystudy.dto;

import jakarta.validation.constraints.NotNull;
import uz.easystudy.domain.AttemptStatus;
import uz.easystudy.domain.PartType;
import uz.easystudy.domain.QuestionType;
import uz.easystudy.domain.ScoringMode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class AttemptDtos {
    private AttemptDtos() {}

    public record StartAttemptRequest(@NotNull Long examId) {}

    public record SaveAnswerRequest(@NotNull Long questionId, @NotNull Map<String, Object> response) {}

    /** Bo'limning urinishdagi holati: boshlanmagan / ochiq / yakunlangan. */
    public record SectionState(Long sectionId, String title, PartType partType, int orderIndex, int durationMinutes,
                               int questionCount, Instant startedAt, Instant endsAt, Instant finishedAt, String status) {}

    public record AttemptView(Long id, Long examId, String examTitle, ScoringMode scoringMode,
                              uz.easystudy.domain.NavigationMode navigationMode, String templateCode, AttemptStatus status,
                              Instant startedAt, Instant expiresAt, Instant submittedAt,
                              BigDecimal rawScore, BigDecimal scaledScore,
                              List<SectionState> sections, Long currentSectionId,
                              Map<Long, Map<String, Object>> answers) {}

    public record AnswerResult(Long questionId, Long sectionId, QuestionType type, Map<String, Object> response,
                               Boolean correct, BigDecimal points, BigDecimal maxPoints, String feedback,
                               String audioUrl, boolean pending, boolean aiGraded) {}

    public record SectionResult(Long sectionId, String title, PartType partType, BigDecimal rawScore, BigDecimal maxScore,
                                BigDecimal scaledScore, boolean pending, int questionCount, int correctCount, BigDecimal pointsPerQuestion) {}

    public record AttemptResult(Long id, Long examId, String examTitle, ScoringMode scoringMode, String templateCode,
                                AttemptStatus status, Instant submittedAt, String studentName,
                                BigDecimal rawScore, BigDecimal maxScore, BigDecimal scaledScore, String label,
                                int pendingCount, uz.easystudy.domain.AiStatus aiStatus,
                                List<SectionResult> sections, List<AnswerResult> answers) {}

    // ---------- o'qituvchi tekshiruvi ----------
    public record GradingRow(Long attemptId, Long examId, String examTitle, String studentName, String studentEmail,
                             Instant submittedAt, AttemptStatus status, int pendingCount, boolean aiGraded,
                             uz.easystudy.domain.AiStatus aiStatus) {}

    public record GradingAttempt(GradingRow summary, List<GradingQuestion> questions) {}

    public record GradingQuestion(Long questionId, Long sectionId, String sectionTitle, QuestionType type, String prompt,
                                  BigDecimal maxPoints, Map<String, Object> response, String audioUrl,
                                  BigDecimal points, String feedback, boolean aiGraded, String transcript) {}

    public record GradeItem(@NotNull Long questionId, @NotNull BigDecimal points, String feedback) {}
    public record GradeRequest(@NotNull List<GradeItem> items) {}
}
