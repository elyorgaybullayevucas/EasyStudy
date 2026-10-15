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
    private final EnrollmentRepository enrollments;
    private final UserRepository users;
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
                CategoryService.brief(c.getCategory()), instructor(c.getInstructor()), s[0], s[1], s[2]);
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

    public static LessonBrief lessonBrief(Lesson l) {
        return new LessonBrief(l.getId(), l.getTitle(), l.getDurationMinutes(), l.getPosition(), l.isPreview());
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
                l.getDurationMinutes(), l.getPosition(), l.isPreview());
    }

    public boolean canManage(AuthPrincipal me, Course c) {
        if (me == null) return false;
        if (me.role() == Role.ADMIN) return true;
        return me.role() == Role.TEACHER && c.getInstructor() != null && c.getInstructor().getId().equals(me.id());
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
                                        boolean publishedOnly, Long instructorId, int page, int size) {
        Specification<Course> spec = (root, q, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (publishedOnly) ps.add(cb.isTrue(root.<Boolean>get("published")));
            if (instructorId != null) ps.add(cb.equal(root.get("instructor").get("id"), instructorId));
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
        Sort sort = Sort.by(Sort.Order.desc("featured"), Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
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
                c.getLessons().stream().map(CourseService::lessonBrief).toList(), quizBriefs(c), enrolled);
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
                c.getLessons().stream().map(this::lessonOut).toList(), quizBriefs(c));
    }

    @Transactional(readOnly = true)
    public PageDto<CourseListItem> adminList(String search, AuthPrincipal me, int page, int size) {
        Long instructorId = me.role() == Role.ADMIN ? null : me.id();
        return list(search, null, null, null, false, instructorId, page, size);
    }

    @Transactional
    public CourseAdminDetail create(CourseInput in, AuthPrincipal me) {
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
    }

    @Transactional
    public void delete(Long id, AuthPrincipal me) {
        courses.delete(getManaged(id, me));
    }

    // ---------------- darslar ----------------

    @Transactional
    public LessonOut addLesson(Long courseId, LessonInput in, AuthPrincipal me) {
        Course c = getManaged(courseId, me);
        Lesson l = new Lesson();
        l.setCourse(c);
        applyLesson(l, in);
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
        getManaged(l.getCourse().getId(), me);
        applyLesson(l, in);
        l.getCourse().setUpdatedAt(Instant.now());
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

    private void applyLesson(Lesson l, LessonInput in) {
        l.setTitle(in.title().trim());
        l.setContent(in.content() == null ? "" : in.content());
        l.setVideoUrl(blankToNull(in.videoUrl()));
        String newKey = blankToNull(in.videoKey());
        if (l.getVideoKey() != null && !l.getVideoKey().equals(newKey)) media.delete(l.getVideoKey()); // eski video o'chadi
        l.setVideoKey(newKey);
        l.setDurationMinutes(in.durationMinutes());
        if (in.position() != null) l.setPosition(in.position());
        l.setPreview(in.preview());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
