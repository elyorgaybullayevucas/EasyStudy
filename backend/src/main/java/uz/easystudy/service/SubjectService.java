package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.*;
import uz.easystudy.dto.CourseDtos.CategoryBrief;
import uz.easystudy.dto.CourseDtos.CategoryDto;
import uz.easystudy.dto.CourseDtos.CourseListItem;
import uz.easystudy.dto.LearningDtos.SubjectAttemptRow;
import uz.easystudy.dto.LearningDtos.SubjectOverview;
import uz.easystudy.dto.SubjectDtos.PlacementDto;
import uz.easystudy.dto.SubjectDtos.SubjectDto;
import uz.easystudy.repository.*;
import uz.easystudy.security.AuthPrincipal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/** Onlayn maktab: fanlar, bosqichlar, daraja testi natijasi bo'yicha joylashtirish, o'qituvchi nazorati. */
@Service
@RequiredArgsConstructor
public class SubjectService {

    private final CategoryRepository categories;
    private final CourseRepository courses;
    private final PlacementRepository placements;
    private final EnrollmentRepository enrollments;
    private final AttemptRepository attempts;
    private final CourseService courseService;
    private final CategoryService categoryService;
    private final ExamService examService;

    @Transactional(readOnly = true)
    public List<SubjectDto> list(AuthPrincipal me) {
        return categories.findByGroupOrderByPositionAscNameAsc(CategoryGroup.SCHOOL).stream().map(c -> toDto(c, me)).toList();
    }

    @Transactional(readOnly = true)
    public SubjectDto get(String slug, AuthPrincipal me) {
        Category c = categories.findBySlug(slug).orElseThrow(() -> AppException.notFound("Fan topilmadi"));
        return toDto(c, me);
    }

    private SubjectDto toDto(Category c, AuthPrincipal me) {
        List<Course> stages = courses.findByCategoryIdOrderByStageAscCreatedAtDesc(c.getId()).stream()
                .filter(x -> x.isPublished() || courseService.canManage(me, x)).toList();
        List<CourseListItem> items = courseService.toListItems(stages);
        List<CategoryBrief> certs = CategoryService.certSlugs(c).stream()
                .map(s -> categories.findBySlug(s).map(CategoryService::brief).orElse(null)).filter(Objects::nonNull).toList();
        PlacementDto my = null;
        List<Long> completed = List.of(), enrolled = List.of();
        if (me != null) {
            my = placements.findByUserIdAndCategoryId(me.id(), c.getId()).map(SubjectService::placementDto).orElse(null);
            List<Long> done = new ArrayList<>(), enr = new ArrayList<>();
            for (Course x : stages) {
                enrollments.findByUserIdAndCourseId(me.id(), x.getId()).ifPresent(e -> { enr.add(x.getId()); if (e.getCompletedAt() != null) done.add(x.getId()); });
            }
            completed = done;
            enrolled = enr;
        }
        long courseCount = stages.stream().filter(Course::isPublished).count();
        long examCount = 0;
        for (Object[] r : categories.examCounts(true)) if (r[0].equals(c.getId())) examCount = ((Number) r[1]).longValue();
        return new SubjectDto(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getIcon(), courseCount, examCount,
                CourseService.examBrief(c.getPlacementExam()), items, certs, my, completed, enrolled);
    }

    public static PlacementDto placementDto(Placement p) {
        return new PlacementDto(p.getCategory().getSlug(), p.getCategory().getName(), p.getScorePercent(), p.getStage(),
                p.getCourse() == null ? null : p.getCourse().getSlug(), p.getCourse() == null ? null : p.getCourse().getTitle(), p.getCreatedAt());
    }

    /** Daraja testi baholangach: foiz -> bosqich (min_placement_score bo'yicha eng yuqori mos bosqich). */
    @Transactional
    public PlacementDto placeAfterAttempt(Attempt a) {
        Optional<Category> cat = categories.findByPlacementExamId(a.getExam().getId());
        if (cat.isEmpty() || a.getRawScore() == null) return null;
        BigDecimal max = a.getExam().getSections().stream().flatMap(s -> s.getQuestions().stream()).map(Question::getPoints).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (max.signum() == 0) return null;
        int percent = a.getRawScore().multiply(BigDecimal.valueOf(100)).divide(max, 0, RoundingMode.HALF_UP).intValue();
        List<Course> stages = courses.findByCategoryIdAndStageIsNotNullOrderByStageAsc(cat.get().getId()).stream().filter(Course::isPublished).toList();
        Course best = null;
        for (Course c : stages) if (percent >= c.getMinPlacementScore() && (best == null || c.getStage() >= best.getStage())) best = c;
        if (best == null && !stages.isEmpty()) best = stages.get(0);
        Placement p = placements.findByUserIdAndCategoryId(a.getUser().getId(), cat.get().getId()).orElseGet(Placement::new);
        p.setUserId(a.getUser().getId());
        p.setCategory(cat.get());
        p.setAttemptId(a.getId());
        p.setScorePercent((short) percent);
        p.setStage(best == null ? (short) 1 : best.getStage());
        p.setCourse(best);
        p.setCreatedAt(java.time.Instant.now());
        placements.save(p);
        return placementDto(p);
    }

    @Transactional(readOnly = true)
    public PlacementDto placementFor(Attempt a) {
        return categories.findByPlacementExamId(a.getExam().getId())
                .flatMap(c -> placements.findByUserIdAndCategoryId(a.getUser().getId(), c.getId()))
                .filter(p -> Objects.equals(p.getAttemptId(), a.getId()))
                .map(SubjectService::placementDto).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<PlacementDto> myPlacements(Long userId) {
        return placements.findByUserId(userId).stream().map(SubjectService::placementDto).toList();
    }

    // ---------------- o'qituvchi nazorati ----------------

    @Transactional(readOnly = true)
    public SubjectOverview overview(String slug, AuthPrincipal me) {
        Category c = categories.findBySlug(slug).orElseThrow(() -> AppException.notFound("Fan topilmadi"));
        if (me.role() != Role.ADMIN && !categoryService.isTeacherOf(me.id(), c.getId())) throw AppException.forbidden("Bu fan sizga biriktirilmagan");
        List<Course> list = courses.findByCategoryIdOrderByStageAscCreatedAtDesc(c.getId());
        List<CourseListItem> items = courseService.toListItems(list);
        long students = items.stream().mapToLong(CourseListItem::studentCount).sum();
        long placed = placements.findAll().stream().filter(p -> p.getCategory().getId().equals(c.getId())).count();
        List<SubjectAttemptRow> rows = attempts.recentByCategory(c.getId(), PageRequest.of(0, 30)).stream()
                .map(a -> new SubjectAttemptRow(a.getId(), a.getUser().getFullName(), a.getExam().getTitle(), a.getSubmittedAt(),
                        a.getRawScore(), a.getScaledScore(), a.getStatus().name())).toList();
        return new SubjectOverview(CategoryService.toDto(c, items.size(), 0), items,
                examService.adminList(me).stream().filter(e -> e.category() != null && e.category().id().equals(c.getId())).toList(),
                students, placed, rows);
    }
}
