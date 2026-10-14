package uz.easystudy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import uz.easystudy.domain.QuestionType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class ExamDtos {
    private ExamDtos() {}

    // ---------- public (student) view: answer_key YO'Q ----------
    public record ExamSummary(Long id, String code, String title, String description, int totalMinutes, int questionCount) {}

    public record ExamDetail(Long id, String code, String title, String description, List<SectionView> sections) {}

    public record SectionView(Long id, String title, int orderIndex, int durationMinutes, List<QuestionView> questions) {}

    public record QuestionView(Long id, int orderIndex, QuestionType type, String prompt, String passage,
                               List<Map<String, Object>> options, BigDecimal points) {}

    // ---------- admin / teacher ----------
    public record CreateExamRequest(
            @NotBlank @Size(max = 40) String code,
            @NotBlank @Size(max = 255) String title,
            String description,
            boolean published) {}

    public record CreateSectionRequest(
            @NotBlank String title,
            @Min(1) int orderIndex,
            @Min(1) int durationMinutes,
            String audioKey) {}

    public record CreateQuestionRequest(
            @Min(1) int orderIndex,
            @NotNull QuestionType type,
            @NotBlank String prompt,
            String passage,
            List<Map<String, Object>> options,
            @NotEmpty List<String> accepted,
            @NotNull BigDecimal points) {}
}
