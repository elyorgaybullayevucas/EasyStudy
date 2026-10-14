package uz.easystudy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import uz.easystudy.domain.CourseLevel;
import uz.easystudy.domain.QuestionType;
import uz.easystudy.dto.CourseDtos.CategoryBrief;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class ExamDtos {
    private ExamDtos() {}

    // ---------- talaba ko'rinishi: answer_key YO'Q ----------
    public record ExamSummary(Long id, String code, String title, String description, CourseLevel level,
                              boolean featured, boolean published, CategoryBrief category,
                              int totalMinutes, int questionCount, long attemptCount) {}

    public record ExamDetail(Long id, String code, String title, String description, CourseLevel level,
                             boolean featured, CategoryBrief category, List<SectionView> sections) {}

    public record SectionView(Long id, String title, int orderIndex, int durationMinutes, List<QuestionView> questions) {}

    public record QuestionView(Long id, int orderIndex, QuestionType type, String prompt, String passage,
                               List<Map<String, Object>> options, BigDecimal points) {}

    // ---------- admin / teacher ----------
    public record QuestionAdminView(Long id, int orderIndex, QuestionType type, String prompt, String passage,
                                    List<Map<String, Object>> options, List<String> accepted, BigDecimal points) {}

    public record SectionAdminView(Long id, String title, int orderIndex, int durationMinutes, String audioKey,
                                   List<QuestionAdminView> questions) {}

    public record BandRow(int minRaw, int maxRaw, BigDecimal scaled) {}

    public record ExamAdminDetail(Long id, String code, String title, String description, CourseLevel level,
                                  boolean featured, boolean published, CategoryBrief category,
                                  List<SectionAdminView> sections, List<BandRow> bands) {}

    public record ExamInput(
            @NotBlank @Size(max = 40) String code,
            @NotBlank @Size(max = 255) String title,
            String description,
            CourseLevel level,
            boolean featured,
            boolean published,
            Long categoryId) {}

    public record SectionInput(
            @NotBlank String title,
            @Min(1) int orderIndex,
            @Min(1) int durationMinutes,
            String audioKey) {}

    public record QuestionInput(
            @Min(1) int orderIndex,
            @NotNull QuestionType type,
            @NotBlank String prompt,
            String passage,
            List<Map<String, Object>> options,
            List<String> accepted,
            @NotNull BigDecimal points) {}

    public record BandsInput(@NotEmpty List<BandRow> bands) {}
}
