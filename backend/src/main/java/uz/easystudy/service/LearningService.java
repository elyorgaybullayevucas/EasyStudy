package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.*;
import uz.easystudy.dto.CourseDtos.LessonOut;
import uz.easystudy.dto.LearningDtos.*;
import uz.easystudy.repository.*;
import uz.easystudy.security.AuthPrincipal;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningService {

    private static final SecureRandom RNG = new SecureRandom();

    private final CourseService courseService;
    private final CourseRepository courses;
    private final LessonRepository lessons;
    private final QuizRepository quizzes;
    private final EnrollmentRepository enrollments;
    private final LessonProgressRepository lessonProgress;
    private final QuizAttemptRepository quizAttempts;
    private final CertificateRepository certificates;
    private final UserRepository users;
    private final AuditService audit;

    // ---------------- yozilish va progress ----------------

    @Transactional
    public CourseProgress enroll(String slug, AuthPrincipal me, String ip) {
        Course c = courseService.getVisible(slug, me);
        if (!enrollments.existsByUserIdAndCourseId(me.id(), c.getId())) {
            Enrollment e = new Enrollment();
            e.setUser(users.getReferenceById(me.id()));
            e.setCourse(c);
            enrollments.save(e);
            audit.log(me.id(), "ENROLL", "course:" + c.getId(), ip);
        }
        return progress(me.id(), c);
    }

    @Transactional(readOnly = true)
    public CourseProgress progress(String slug, AuthPrincipal me) {
        return progress(me.id(), courseService.getVisible(slug, me));
    }

    public CourseProgress progress(Long userId, Course c) {
        List<Long> lessonIds = c.getLessons().stream().map(Lesson::getId).toList();
        Set<Long> done = new HashSet<>(lessonProgress.completedLessonIds(userId, c.getId()));
        List<QuizProgress> qp = quizProgress(userId, c);

        int totalItems = lessonIds.size() + qp.size();
        long doneItems = done.size() + qp.stream().filter(QuizProgress::passed).count();
        int percent = totalItems == 0 ? 0 : (int) Math.round(doneItems * 100.0 / totalItems);

        boolean enrolled = enrollments.existsByUserIdAndCourseId(userId, c.getId());
        String cert = certificates.findByUserIdAndCourseId(userId, c.getId()).map(Certificate::getCode).orElse(null);
        Long next = lessonIds.stream().filter(id -> !done.contains(id)).findFirst().orElse(null);

        return new CourseProgress(c.getId(), enrolled, lessonIds.stream().filter(done::contains).toList(),
                lessonIds.size(), qp, percent, totalItems > 0 && doneItems == totalItems, cert, next);
    }

    private List<QuizProgress> quizProgress(Long userId, Course c) {
        List<Quiz> qs = c.getQuizzes();
        if (qs.isEmpty()) return List.of();
        Map<Long, Object[]> best = new HashMap<>();
        for (Object[] r : quizAttempts.bestByQuiz(userId, qs.stream().map(Quiz::getId).toList())) best.put((Long) r[0], r);
        return qs.stream().map(q -> {
            Object[] r = best.get(q.getId());
            Integer score = r == null ? null : ((Number) r[1]).intValue();
            long attempts = r == null ? 0 : ((Number) r[2]).longValue();
            return new QuizProgress(q.getId(), q.getTitle(), score, attempts, score != null && score >= q.getPassScore());
        }).toList();
    }

    /** Progressni qayta hisoblaydi; kurs tugagan bo'lsa sertifikat beradi. */
    @Transactional
    public CourseProgress syncCompletion(Long userId, Course c) {
        CourseProgress p = progress(userId, c);
        if (!p.enrolled() || !p.completed()) return p;

        enrollments.findByUserIdAndCourseId(userId, c.getId()).ifPresent(e -> {
            if (e.getCompletedAt() == null) e.setCompletedAt(Instant.now());
        });
        if (p.certificateCode() == null) {
            Certificate cert = new Certificate();
            cert.setCode(newCode());
            cert.setUser(users.getReferenceById(userId));
            cert.setCourse(c);
            try {
                certificates.saveAndFlush(cert);
            } catch (DataIntegrityViolationException ignored) {
                // parallel so'rov allaqachon yaratgan
            }
            String code = certificates.findByUserIdAndCourseId(userId, c.getId()).map(Certificate::getCode).orElse(null);
            return new CourseProgress(p.courseId(), p.enrolled(), p.completedLessonIds(), p.totalLessons(), p.quizzes(),
                    p.progressPercent(), p.completed(), code, p.nextLessonId());
        }
        return p;
    }

    private String newCode() {
        byte[] b = new byte[6];
        while (true) {
            RNG.nextBytes(b);
            String code = HexFormat.of().withUpperCase().formatHex(b);
            if (!certificates.existsByCode(code)) return code;
        }
    }

    // ---------------- darslar ----------------

    @Transactional(readOnly = true)
    public LessonOut lesson(String slug, Long lessonId, AuthPrincipal me) {
        Course c = courseService.getVisible(slug, me);
        Lesson l = lessons.findByIdAndCourseId(lessonId, c.getId()).orElseThrow(() -> AppException.notFound("Dars topilmadi"));
        boolean access = l.isPreview() || (me != null &&
                (enrollments.existsByUserIdAndCourseId(me.id(), c.getId()) || courseService.canManage(me, c)));
        if (!access) throw AppException.forbidden("Darsni ko'rish uchun kursga yoziling");
        return courseService.lessonOut(l);
    }

    private Course requireEnrollment(Long userId, Long courseId) {
        Course c = courses.findById(courseId).orElseThrow(() -> AppException.notFound("Kurs topilmadi"));
        if (!enrollments.existsByUserIdAndCourseId(userId, courseId)) throw AppException.forbidden("Avval kursga yoziling");
        return c;
    }

    @Transactional
    public CourseProgress completeLesson(Long lessonId, Long userId) {
        Lesson l = lessons.findById(lessonId).orElseThrow(() -> AppException.notFound("Dars topilmadi"));
        Course c = requireEnrollment(userId, l.getCourse().getId());
        if (lessonProgress.findByUserIdAndLessonId(userId, lessonId).isEmpty()) {
            LessonProgress p = new LessonProgress();
            p.setUserId(userId);
            p.setLessonId(lessonId);
            lessonProgress.save(p);
        }
        return syncCompletion(userId, c);
    }

    @Transactional
    public CourseProgress uncompleteLesson(Long lessonId, Long userId) {
        Lesson l = lessons.findById(lessonId).orElseThrow(() -> AppException.notFound("Dars topilmadi"));
        Course c = requireEnrollment(userId, l.getCourse().getId());
        lessonProgress.findByUserIdAndLessonId(userId, lessonId).ifPresent(lessonProgress::delete);
        return progress(userId, c);
    }

    // ---------------- testlar ----------------

    private Quiz loadQuiz(Long quizId, AuthPrincipal me) {
        Quiz q = quizzes.findById(quizId).orElseThrow(() -> AppException.notFound("Test topilmadi"));
        Course c = q.getCourse();
        if (!enrollments.existsByUserIdAndCourseId(me.id(), c.getId()) && !courseService.canManage(me, c)) {
            throw AppException.forbidden("Avval kursga yoziling");
        }
        return q;
    }

    @Transactional(readOnly = true)
    public QuizPublic quiz(Long quizId, AuthPrincipal me) {
        Quiz q = loadQuiz(quizId, me);
        return new QuizPublic(q.getId(), q.getCourse().getId(), q.getLessonId(), q.getTitle(), q.getDescription(), q.getPassScore(),
                q.getQuestions().stream().map(qq -> new QuestionPublic(qq.getId(), qq.getText(),
                        qq.getOptions().stream().map(o -> new OptionPublic(o.getId(), o.getText())).toList())).toList());
    }

    @Transactional
    public QuizResult submitQuiz(Long quizId, QuizSubmit submit, AuthPrincipal me, String ip) {
        Quiz q = loadQuiz(quizId, me);
        Map<Long, Long> selected = submit.answers().stream()
                .collect(Collectors.toMap(QuizAnswer::questionId, QuizAnswer::optionId, (a, b) -> b));

        List<QuestionResult> results = new ArrayList<>();
        int correct = 0;
        for (QuizQuestion qq : q.getQuestions()) {
            Long correctId = qq.getOptions().stream().filter(QuizOption::isCorrect).map(QuizOption::getId).findFirst().orElse(null);
            Long chosen = selected.get(qq.getId());
            boolean ok = chosen != null && chosen.equals(correctId);
            if (ok) correct++;
            results.add(new QuestionResult(qq.getId(), chosen, correctId, ok));
        }
        int total = q.getQuestions().size();
        int score = total == 0 ? 0 : (int) Math.round(correct * 100.0 / total);
        boolean passed = score >= q.getPassScore();

        QuizAttempt a = new QuizAttempt();
        a.setUserId(me.id());
        a.setQuizId(q.getId());
        a.setScore(score);
        a.setCorrectCount(correct);
        a.setTotalCount(total);
        a.setPassed(passed);
        quizAttempts.save(a);
        audit.log(me.id(), "QUIZ_SUBMIT", "quiz:" + quizId, ip);

        CourseProgress p = enrollments.existsByUserIdAndCourseId(me.id(), q.getCourse().getId())
                ? syncCompletion(me.id(), q.getCourse()) : progress(me.id(), q.getCourse());
        return new QuizResult(q.getId(), score, correct, total, passed, q.getPassScore(), results, p.completed(), p.certificateCode());
    }

    // ---------------- shaxsiy kabinet ----------------

    @Transactional(readOnly = true)
    public List<MyCourse> myCourses(Long userId) {
        List<Enrollment> list = enrollments.findByUserIdOrderByEnrolledAtDesc(userId);
        Map<Long, long[]> st = courseService.stats(list.stream().map(e -> e.getCourse().getId()).toList());
        return list.stream().map(e -> {
            Course c = e.getCourse();
            CourseProgress p = progress(userId, c);
            return new MyCourse(courseService.toListItem(c, st.get(c.getId())), e.getEnrolledAt(), e.getCompletedAt(),
                    p.progressPercent(), p.completedLessonIds().size(), p.totalLessons(), p.nextLessonId(), p.certificateCode());
        }).toList();
    }

    public static <T, K> Map<K, T> byKey(List<T> list, Function<T, K> key) {
        return list.stream().collect(Collectors.toMap(key, Function.identity(), (a, b) -> a));
    }
}
