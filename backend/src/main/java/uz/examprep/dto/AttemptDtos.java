package uz.examprep.dto;

import jakarta.validation.constraints.NotNull;
import uz.examprep.domain.AttemptStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class AttemptDtos {
    private AttemptDtos() {}

    public record StartAttemptRequest(@NotNull Long examId) {}

    public record SaveAnswerRequest(@NotNull Long questionId, @NotNull Map<String, Object> response) {}

    public record AttemptView(Long id, Long examId, String examTitle, AttemptStatus status,
                              Instant startedAt, Instant expiresAt, Instant submittedAt,
                              BigDecimal rawScore, BigDecimal scaledScore,
                              Map<Long, Map<String, Object>> answers) {}

    public record AnswerResult(Long questionId, Map<String, Object> response, Boolean correct, BigDecimal points) {}

    public record AttemptResult(Long id, Long examId, String examTitle, AttemptStatus status,
                                BigDecimal rawScore, BigDecimal maxScore, BigDecimal scaledScore,
                                List<AnswerResult> answers) {}
}
