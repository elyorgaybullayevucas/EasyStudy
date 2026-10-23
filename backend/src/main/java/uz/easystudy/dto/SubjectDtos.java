package uz.easystudy.dto;

import uz.easystudy.dto.CourseDtos.CategoryBrief;
import uz.easystudy.dto.CourseDtos.CourseListItem;
import uz.easystudy.dto.CourseDtos.ExamBrief;

import java.time.Instant;
import java.util.List;

/** Onlayn maktab: fan -> daraja testi -> bosqichlar. */
public final class SubjectDtos {
    private SubjectDtos() {}

    /** Talabaning fan bo'yicha joylashuvi (daraja testi natijasi). */
    public record PlacementDto(String categorySlug, String categoryName, int scorePercent, int stage,
                               String courseSlug, String courseTitle, Instant createdAt) {}

    /** Fan sahifasi: bosqichlar (stage bo'yicha tartibda), daraja testi, tayyorlanadigan sertifikatlar, mening joylashuvim. */
    public record SubjectDto(Long id, String name, String slug, String description, String icon, long courseCount, long examCount,
                             ExamBrief placementExam, List<CourseListItem> stages, List<CategoryBrief> certifications,
                             PlacementDto myPlacement, List<Long> completedCourseIds, List<Long> enrolledCourseIds) {}
}
