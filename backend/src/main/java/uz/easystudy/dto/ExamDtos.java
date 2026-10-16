package uz.easystudy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import uz.easystudy.domain.CourseLevel;
import uz.easystudy.domain.NavigationMode;
import uz.easystudy.domain.PartType;
import uz.easystudy.domain.QuestionType;
import uz.easystudy.domain.ScoringMode;
import uz.easystudy.dto.CourseDtos.CategoryBrief;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class ExamDtos {
    private ExamDtos() {}

    // ---------- talaba ko'rinishi: answer_key YO'Q ----------
    public record ExamSummary(Long id, String code, String title, String description, CourseLevel level,
                              boolean featured, boolean published, CategoryBrief category, String templateCode,
                              ScoringMode scoringMode, NavigationMode navigationMode, List<String> parts,
                              int totalMinutes, int questionCount, long attemptCount) {}

    public record ExamDetail(Long id, String code, String title, String description, CourseLevel level,
                             boolean featured, CategoryBrief category, String templateCode, ScoringMode scoringMode,
                             NavigationMode navigationMode, String instructions, List<SectionView> sections) {}

    public record SectionView(Long id, String title, PartType partType, int orderIndex, int durationMinutes,
                              String instructions, String audioUrl, boolean manual, List<QuestionView> questions) {}

    public record QuestionView(Long id, int orderIndex, QuestionType type, String prompt, String passage,
                               List<Map<String, Object>> options, BigDecimal points, String imageUrl,
                               Integer minWords, Integer prepSeconds, Integer answerSeconds) {}

    // ---------- admin / teacher ----------
    public record QuestionAdminView(Long id, int orderIndex, QuestionType type, String prompt, String passage,
                                    List<Map<String, Object>> options, List<String> accepted, BigDecimal points,
                                    BigDecimal weight, String imageKey, String imageUrl,
                                    Integer minWords, Integer prepSeconds, Integer answerSeconds) {}

    public record BandRow(int minRaw, int maxRaw, BigDecimal scaled, String label) {}

    public record SectionAdminView(Long id, String title, PartType partType, int orderIndex, int durationMinutes,
                                   String instructions, BigDecimal defaultPoints, String audioKey, String audioUrl,
                                   List<BandRow> bands, List<QuestionAdminView> questions) {}

    public record ExamAdminDetail(Long id, String code, String title, String description, CourseLevel level,
                                  boolean featured, boolean published, CategoryBrief category, Long ownerId,
                                  String ownerName, String templateCode, ScoringMode scoringMode, NavigationMode navigationMode,
                                  String instructions, List<SectionAdminView> sections, List<BandRow> bands) {}

    public record ExamInput(
            @NotBlank @Size(max = 40) String code,
            @NotBlank @Size(max = 255) String title,
            String description,
            CourseLevel level,
            boolean featured,
            boolean published,
            Long categoryId,
            ScoringMode scoringMode,
            NavigationMode navigationMode,
            String instructions) {}

    public record SectionInput(
            @NotBlank String title,
            PartType partType,
            @Min(1) int orderIndex,
            @Min(1) int durationMinutes,
            String instructions,
            BigDecimal defaultPoints,
            String audioKey) {}

    public record QuestionInput(
            @Min(1) int orderIndex,
            @NotNull QuestionType type,
            @NotBlank String prompt,
            String passage,
            List<Map<String, Object>> options,
            List<String> accepted,
            @NotNull BigDecimal points,
            BigDecimal weight,
            @Size(max = 255) String imageKey,
            Integer minWords,
            Integer prepSeconds,
            Integer answerSeconds) {}

    public record BandsInput(@NotEmpty List<BandRow> bands) {}

    // ---------- shablonlar ----------
    public record TemplateSection(String title, PartType partType, int durationMinutes, BigDecimal defaultPoints,
                                  int questionCount, String questionTypes, String instructions, boolean manual) {}

    public record TemplateInfo(String code, String title, String group, String description, ScoringMode scoringMode,
                               NavigationMode navigationMode, String scoringNote, int totalMinutes, List<TemplateSection> sections) {}
}
