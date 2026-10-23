package uz.easystudy.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.*;
import uz.easystudy.dto.CourseDtos.*;
import uz.easystudy.dto.PageDto;
import uz.easystudy.repository.*;
import uz.easystudy.security.AuthPrincipal;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courses;
    private final LessonRepository lessons;
    private final QuizRepository quizzes;
    private final CourseModuleRepository modules;
    private final EnrollmentRepository enrollments;
    private final UserRepository users;
    private final ExamRepository exams;
    private final CategoryService categoryService;
    private final uz.easystudy.media.MediaService media;

    // ---------------- umumiy ----------------

    /** [lessonCount, totalMinutes, studentCount] per course id */
    public Map<Long, long[]> stats(List<Long> ids) {
        Map<Long, long[]> m = new HashMap<>();
        for (Long id : ids) m.put(id, new long[3]);
        if (ids.isEmpty()) return m;
        for (Object[] r : courses.lessonStats(ids)) {
            long[] s = m.get((Long) r[0]);
            s[0] = ((Number) r[1]).longValue();
            s[1] = ((Number) r[2]).longValue();
        }
        for (Object[] r : courses.studentCounts(ids)) m.get((Long) r[0])[2] = ((Number) r[1]).longValue();
        return m;
    }

    public static InstructorBrief instructor(User u) {
        return u == null ? null : new InstructorBrief(u.getId(), u.getFullName());
    }

    public CourseListItem toListItem(Course c, long[] s) {
        return new CourseListItem(c.getId(), c.getTitle(), c.getSlug(), c.getShortDescription(), c.getThumbnailUrl(),
                c.getLevel(), c.getPrice(), c.isFeatured(), c.isPublished(),
                CategoryService.brief(c.getCategory()), instructor(c.getInstructor()), s[0], s[1], s[2],
                c.getStage(), c.getMinPlacementScore(), c.isSequential());
    }

    public List<CourseListItem> toListItems(List<Course> list) {
        Map<Long, long[]> st = stats(list.stream().map(Course::getId).toList());
        return list.stream().map(c -> toListItem(c, st.get(c.getId()))).toList();
    }

    public List<QuizBrief> quizBriefs(Course c) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] r : quizzes.questionCounts(c.getId())) counts.put((Long) r[0], ((Number) r[1]).longValue());
        return c.getQuizzes().stream().map(q -> new QuizBrief(q.getId(), q.getTitle(), q.getLessonId(), q.getPassScore(),
                counts.getOrDefault(q.getId(), 0L))).toList();
    }

    public static ExamBrief examBrief(Exam e) {
        if (e == null || !e.isPublished()) return null;
        return new ExamBrief(e.getId(), e.getTitle(), e.getSections().stream().mapToInt(Section::getDurationMinutes).sum(),
                e.getSections().stream().mapToInt(s -> s.getQuestions().size()).sum());
    }

    public static LessonBrief lessonBrief(Lesson l) {
        return new LessonBrief(l.getId(), l.getTitle(), l.getDurationMinutes(), l.getPosition(), l.isPreview(), examBrief(l.getExam()),
                l.getModule() == null ? null : l.getModule().getId());
    }

    public static List<ModuleBrief> moduleBriefs(Course c) {
        return c.getModules().stream().map(m -> new ModuleBrief(m.getId(), m.getTitle(), m.getDescription(), m.getPosition(), examBrief(m.getExam()),
                c.getLessons().stream().filter(l -> l.getModule() != null && l.getModule().getId().equals(m.getId())).map(Lesson::getId).toList())).toList();
    }

    /** Platformadagi video bo'lsa vaqtli imzolangan havola; aks holda tashqi havola. */
    public LessonOut lessonOut(Lesson l) {
        String url;
        String source;
        if (l.getVideoKey() != null && !l.getVideoKey().isBlank()) {
            url = media.url(l.getVideoKey());
            source = "PLATFORM";
        } else if (l.getVideoUrl() != null && !l.getVideoUrl().isBlank()) {
            url = l.getVideoUrl();
            source = "EXTERNAL";
        } else {
            url = null;
            source = null;
        }
        return new LessonOut(l.getId(), l.getCourse().getId(), l.getTitle(), l.getContent(), url, source, l.getVideoKey(),
                l.getDurationMinutes(), l.getPosition(), l.isPreview(), examBrief(l.getExam()),
                l.getModule() == null ? null : l.getModule().getId());
    }

    /** Admin, kurs muallifi yoki fanga mas'ul o'qituvchi. */
    public boolean canManage(AuthPrincipal me, Course c) {
        if (me == null) return false;
        if (me.role() == Role.ADMIN) return true;
        if (me.role() != Role.TEACHER) return false;
        if (c.getInstructor() != null && c.getInstructor().getId().equals(me.id())) return true;
        return c.getCategory() != null && categoryService.isTeacherOf(me.id(), c.getCategory().getId());
    }

    /** Nashr etilgan, yoki boshqaruvchi uchun har qanday kurs. */
    @Transactional(readOnly = true)
    public Course getVisible(String slug, AuthPrincipal me) {
        Course c = courses.findBySlug(slug).orElseThrow(() -> AppException.notFound("Kurs topilmadi"));
        if (!c.isPublished() && !canManage(me, c)) throw AppException.notFound("Kurs topilmadi");
        return c;
    }

    @Transactional(readOnly = true)
    public PageDto<CourseListItem> list(String search, String categorySlug, CourseLevel level, Boolean featured,
                                        boolean publishedOnly, Long instructorId, List<Long> categoryIds, int page, int size) {
        Specification<Course> spec = (root, q, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (publishedOnly) ps.add(cb.isTrue(root.<Boolean>get("published")));
            if (instructorId != null) {
                Predicate mine = cb.equal(root.get("instructor").get("id"), instructorId);
                ps.add(categoryIds == null || categoryIds.isEmpty() ? mine : cb.or(mine, root.get("category").get("id").in(categoryIds)));
            }
            if (search != null && !search.isBlank()) {
                String p = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                ps.add(cb.or(cb.like(cb.lower(root.<String>get("title")), p),
                        cb.like(cb.lower(root.<String>get("shortDescription")), p)));
            }
            if (categorySlug != null && !categorySlug.isBlank()) ps.add(cb.equal(root.get("category").get("slug"), categorySlug));
            if (level != null) ps.add(cb.equal(root.get("level"), level));
            if (featured != null) ps.add(cb.equal(root.get("featured"), featured));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        Sort sort = Sort.by(Sort.Order.desc("featured"), Sort.Order.asc("stage"), Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        Page<Course> p = courses.findAll(spec, PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50), sort));
        return new PageDto<>(toListItems(p.getContent()), p.getTotalElements(), page, size);
    }

    @Transactional(readOnly = true)
    public CourseDetail detail(String slug, AuthPrincipal me) {
        Course c = getVisible(slug, me);
        long[] s = stats(List.of(c.getId())).get(c.getId());
        boolean enrolled = me != null && enrollments.existsByUserIdAndCourseId(me.id(), c.getId());
        return new CourseDetail(c.getId(), c.getTitle(), c.getSlug(), c.getShortDescription(), c.getDescription(),
                c.getThumbnailUrl(), c.getLevel(), c.getPrice(), c.isFeatured(), c.isPublished(),
                CategoryService.brief(c.getCategory()), instructor(c.getInstructor()), s[0], s[1], s[2],
                c.getCreatedAt(), c.getUpdatedAt(),
                c.getLessons().stream().map(CourseService::lessonBrief).toList(), quizBriefs(c), enrolled, examBrief(c.getFinalExam()),
                c.getStage(), c.getMinPlacementScore(), c.isSequential(), moduleBriefs(c));
    }

    // ---------------- admin / teacher ----------------

    @Transactional(readOnly = true)
    public Course getManaged(Long id, AuthPrincipal me) {
        Course c = courses.findById(id).orElseThrow(() -> AppException.notFound("Kurs topilmadi"));
        if (!canManage(me, c)) throw AppException.forbidden("Bu kursni boshqarishga ruxsat yo'q");
        return c;
    }

    @Transactional(readOnly = true)
    public CourseAdminDetail adminDetail(Long id, AuthPrincipal me) {
        return toAdminDetail(getManaged(id, me));
    }

    private CourseAdminDetail toAdminDetail(Course c) {
        long[] s = stats(List.of(c.getId())).get(c.getId());
        return new CourseAdminDetail(c.getId(), c.getTitle(), c.getSlug(), c.getShortDescription(), c.getDescription(),
                c.getThumbnailUrl(), c.getLevel(), c.getPrice(), c.isFeatured(), c.isPublished(),
                CategoryService.brief(c.getCategory()), instructor(c.getInstructor()), s[0], s[1], s[2],
                c.getCreatedAt(), c.getUpdatedAt(),
                c.getLessons().stream().map(this::lessonOut).toList(), quizBriefs(c),
                c.getFinalExam() == null ? null : new ExamBrief(c.getFinalExam().getId(), c.getFinalExam().getTitle(), 0, 0),
                c.getStage(), c.getMinPlacementScore(), c.isSequential(),
                c.getModules().stream().map(m -> new ModuleBrief(m.getId(), m.getTitle(), m.getDescription(), m.getPosition(),
                        m.getExam() == null ? null : new ExamBrief(m.getExam().getId(), m.getExam().getTitle(), 0, 0),
                        c.getLessons().stream().filter(l -> l.getModule() != null && l.getModule().getId().equals(m.getId())).map(Lesson::getId).toList())).toList());
    }

    @Transactional(readOnly = true)
    public PageDto<CourseListItem> adminList(String search, AuthPrincipal me, int page, int size) {
        if (me.role() == Role.ADMIN) return list(search, null, null, null, false, null, null, page, size);
        return list(search, null, null, null, false, me.id(), categoryService.teacherCategoryIds(me.id()), page, size);
    }

    /** O'qituvchi faqat o'ziga biriktirilgan fanda kurs ochadi. */
    private void checkCategoryAllowed(Long categoryId, AuthPrincipal me) {
        if (me.role() == Role.ADMIN) return;
        if (categoryId == null || !categoryService.isTeacherOf(me.id(), categoryId)) {
            throw AppException.forbidden("Kursni faqat sizga biriktirilgan fan (yo'nalish) ichida yaratish mumkin");
        }
    }

    @Transactional
    public CourseAdminDetail create(CourseInput in, AuthPrincipal me) {
        checkCategoryAllowed(in.categoryId(), me);
        Course c = new Course();
        apply(c, in);
        c.setSlug(SlugUtil.unique(in.title(), courses::existsBySlug));
        c.setInstructor(users.getReferenceById(me.id()));
        courses.save(c);
        return toAdminDetail(c);
    }

    @Transactional
    public CourseAdminDetail update(Long id, CourseInput in, AuthPrincipal me) {
        Course c = getManaged(id, me);
        if (!c.getTitle().equals(in.title())) {
            c.setSlug(SlugUtil.unique(in.title(), s -> !s.equals(c.getSlug()) && courses.existsBySlug(s)));
        }
        apply(c, in);
        c.setUpdatedAt(Instant.now());
        return toAdminDetail(c);
    }

    private void apply(Course c, CourseInput in) {
        c.setTitle(in.title().trim());
        c.setShortDescription(in.shortDescription().trim());
        c.setDescription(in.description() == null ? "" : in.description());
        c.setThumbnailUrl(blankToNull(in.thumbnailUrl()));
        c.setLevel(in.level() == null ? CourseLevel.BEGINNER : in.level());
        c.setPrice(in.price());
        c.setCategory(categoryService.require(in.categoryId()));
        c.setPublished(in.published());
        c.setFeatured(in.featured());
        c.setFinalExam(in.finalExamId() == null ? null : exams.findById(in.finalExamId()).orElseThrow(() -> AppException.badRequest("Imtihon topilmadi")));
        c.setStage(in.stage() == null || in.stage() <= 0 ? null : in.stage());
        c.setMinPlacementScore(in.minPlacementScore() == null ? 0 : (short) Math.max(0, Math.min(100, in.minPlacementScore())));
        c.setSequential(in.sequential());
    }

    @Transactional
    public void delete(Long id, AuthPrincipal me) {
        courses.delete(getManaged(id, me));
    }

    // ---------------- bo'limlar (modullar) ----------------

    @Transactional
    public ModuleBrief addModule(Long courseId, ModuleInput in, AuthPrincipal me) {
        Course c = getManaged(courseId, me);
        CourseModule m = new CourseModule();
        m.setCourse(c);
        applyModule(m, in);
        if (in.position() == null) m.setPosition(c.getModules().stream().mapToInt(CourseModule::getPosition).max().orElse(0) + 1);
        modules.save(m);
        c.getModules().add(m);
        c.setUpdatedAt(Instant.now());
        return new ModuleBrief(m.getId(), m.getTitle(), m.getDescription(), m.getPosition(), examBrief(m.getExam()), List.of());
    }

    @Transactional
    public ModuleBrief updateModule(Long moduleId, ModuleInput in, AuthPrincipal me) {
        CourseModule m = modules.findById(moduleId).orElseThrow(() -> AppException.notFound("Bo'lim topilmadi"));
        Course c = getManaged(m.getCourse().getId(), me);
        applyModule(m, in);
        c.setUpdatedAt(Instant.now());
        return new ModuleBrief(m.getId(), m.getTitle(), m.getDescription(), m.getPosition(), examBrief(m.getExam()),
                c.getLessons().stream().filter(l -> l.getModule() != null && l.getModule().getId().equals(m.getId())).map(Lesson::getId).toList());
    }

    @Transactional
    public void deleteModule(Long moduleId, AuthPrincipal me) {
        CourseModule m = modules.findById(moduleId).orElseThrow(() -> AppException.notFound("Bo'lim topilmadi"));
        Course c = getManaged(m.getCourse().getId(), me);
        for (Lesson l : c.getLessons()) if (l.getModule() != null && l.getModule().getId().equals(m.getId())) l.setModule(null);
        c.getModules().remove(m);
        modules.delete(m);
        c.setUpdatedAt(Instant.now());
    }

    private void applyModule(CourseModule m, ModuleInput in) {
        m.setTitle(in.title().trim());
        m.setDescription(in.description() == null ? "" : in.description());
        if (in.position() != null) m.setPosition(in.position());
        m.setExam(in.examId() == null ? null : exams.findById(in.examId()).orElseThrow(() -> AppException.badRequest("Imtihon topilmadi")));
    }

    // ---------------- darslar ----------------

    @Transactional
    public LessonOut addLesson(Long courseId, LessonInput in, AuthPrincipal me) {
        Course c = getManaged(courseId, me);
        Lesson l = new Lesson();
        l.setCourse(c);
        applyLesson(l, in, c);
        if (in.position() == null) {
            l.setPosition(c.getLessons().stream().mapToInt(Lesson::getPosition).max().orElse(0) + 1);
        }
        lessons.save(l);
        c.setUpdatedAt(Instant.now());
        return lessonOut(l);
    }

    @Transactional
    public LessonOut updateLesson(Long lessonId, LessonInput in, AuthPrincipal me) {
        Lesson l = lessons.findById(lessonId).orElseThrow(() -> AppException.notFound("Dars topilmadi"));
        Course c = getManaged(l.getCourse().getId(), me);
        applyLesson(l, in, c);
        c.setUpdatedAt(Instant.now());
        return lessonOut(l);
    }

    @Transactional
    public void deleteLesson(Long lessonId, AuthPrincipal me) {
        Lesson l = lessons.findById(lessonId).orElseThrow(() -> AppException.notFound("Dars topilmadi"));
        Course c = getManaged(l.getCourse().getId(), me);
        c.getLessons().remove(l);
        lessons.delete(l);
        media.delete(l.getVideoKey());
        c.setUpdatedAt(Instant.now());
    }

    private void applyLesson(Lesson l, LessonInput in, Course c) {
        l.setTitle(in.title().trim());
        l.setContent(in.content() == null ? "" : in.content());
        l.setVideoUrl(blankToNull(in.videoUrl()));
        String newKey = blankToNull(in.videoKey());
        if (l.getVideoKey() != null && !l.getVideoKey().equals(newKey)) media.delete(l.getVideoKey()); // eski video o'chadi
        l.setVideoKey(newKey);
        l.setDurationMinutes(in.durationMinutes());
        if (in.position() != null) l.setPosition(in.position());
        l.setPreview(in.preview());
        l.setExam(in.examId() == null ? null : exams.findById(in.examId()).orElseThrow(() -> AppException.badRequest("Imtihon topilmadi")));
        if (in.moduleId() == null) l.setModule(null);
        else l.setModule(c.getModules().stream().filter(m -> m.getId().equals(in.moduleId())).findFirst()
                .orElseThrow(() -> AppException.badRequest("Bo'lim bu kursga tegishli emas")));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
