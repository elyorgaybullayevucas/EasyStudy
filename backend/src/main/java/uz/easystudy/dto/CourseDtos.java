package uz.easystudy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import uz.easystudy.domain.CourseLevel;

import java.time.Instant;
import java.util.List;

public final class CourseDtos {
    private CourseDtos() {}

    public record CategoryDto(Long id, String name, String slug, String description, String icon,
                              uz.easystudy.domain.CategoryGroup group, int position, long courseCount, long examCount) {}

    public record CategoryBrief(Long id, String name, String slug, String icon, uz.easystudy.domain.CategoryGroup group) {}

    public record InstructorBrief(Long id, String fullName) {}

    public record LessonBrief(Long id, String title, int durationMinutes, int position, boolean preview) {}

    /** videoUrl: platformadagi video uchun vaqtli imzolangan havola, aks holda tashqi havola. */
    public record LessonOut(Long id, Long courseId, String title, String content, String videoUrl, String videoSource,
                            String videoKey, int durationMinutes, int position, boolean preview) {}

    public record QuizBrief(Long id, String title, Long lessonId, int passScore, long questionCount) {}

    public record CourseListItem(Long id, String title, String slug, String shortDescription, String thumbnailUrl,
                                 CourseLevel level, int price, boolean featured, boolean published,
                                 CategoryBrief category, InstructorBrief instructor,
                                 long lessonCount, long totalMinutes, long studentCount) {}

    public record CourseDetail(Long id, String title, String slug, String shortDescription, String description,
                               String thumbnailUrl, CourseLevel level, int price, boolean featured, boolean published,
                               CategoryBrief category, InstructorBrief instructor,
                               long lessonCount, long totalMinutes, long studentCount,
                               Instant createdAt, Instant updatedAt,
                               List<LessonBrief> lessons, List<QuizBrief> quizzes, boolean enrolled) {}

    /** Admin ko'rinishi: darslar to'liq (kontent va video bilan). */
    public record CourseAdminDetail(Long id, String title, String slug, String shortDescription, String description,
                                    String thumbnailUrl, CourseLevel level, int price, boolean featured, boolean published,
                                    CategoryBrief category, InstructorBrief instructor,
                                    long lessonCount, long totalMinutes, long studentCount,
                                    Instant createdAt, Instant updatedAt,
                                    List<LessonOut> lessons, List<QuizBrief> quizzes) {}

    // ---------- kirish DTO lari ----------

    public record CourseInput(
            @NotBlank @Size(min = 3, max = 200) String title,
            @NotBlank @Size(min = 10, max = 300) String shortDescription,
            String description,
            @Size(max = 500) String thumbnailUrl,
            CourseLevel level,
            @Min(0) int price,
            Long categoryId,
            boolean published,
            boolean featured) {}

    public record LessonInput(
            @NotBlank @Size(min = 2, max = 200) String title,
            String content,
            @Size(max = 500) String videoUrl,
            @Size(max = 255) String videoKey,
            @Min(0) int durationMinutes,
            Integer position,
            boolean preview) {}

    public record CategoryInput(
            @NotBlank @Size(min = 2, max = 100) String name,
            String description,
            @Size(max = 50) String icon,
            uz.easystudy.domain.CategoryGroup group,
            Integer position) {}
}
