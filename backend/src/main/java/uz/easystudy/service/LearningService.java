package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.*;
import uz.easystudy.dto.CourseDtos.CourseListItem;
import uz.easystudy.dto.CourseDtos.LessonOut;
import uz.easystudy.dto.LearningDtos.*;
import uz.easystudy.repository.*;
import uz.easystudy.security.AuthPrincipal;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * O'quv jarayoni: yozilish (bosqich tekshiruvi bilan), progress (ketma-ket ochiladigan darslar, bo'lim mock natijalari),
 * dars testlari, sertifikat.
 */
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
    private final AttemptRepository attempts;
    private final PlacementRepository placements;
    private final BandConversionRepository bands;
    private final UserRepository users;
    private final AuditService audit;

    // ---------------- yozilish va progress ----------------

    /** Bosqichli kursga yozilish sharti: 1-bosqich ochiq; keyingi bosqich - daraja testi shu bosqichni ko'rsatsa yoki oldingi bosqich tugatilgan bo'lsa. */
    private void checkStageAccess(Course c, AuthPrincipal me) {
        if (c.getStage() == null || c.getStage() <= 1 || courseService.canManage(me, c)) return;
        if (c.getCategory() != null) {
            Optional<Placement> p = placements.findByUserIdAndCategoryId(me.id(), c.getCategory().getId());
            if (p.isPresent() && p.get().getStage() >= c.getStage()) return;
            boolean prevDone = courses.findByCategoryIdAndStageIsNotNullOrderByStageAsc(c.getCategory().getId()).stream()
                    .filter(x -> x.getStage() == c.getStage() - 1)
                    .anyMatch(x -> enrollments.findByUserIdAndCourseId(me.id(), x.getId()).map(e -> e.getCompletedAt() != null).orElse(false));
            if (prevDone) return;
        }
        throw AppException.forbidden((c.getStage() - 1) + "-bosqichni tugating yoki darajani aniqlash testini topshiring - shunda " + c.getStage() + "-bosqich ochiladi");
    }

    @Transactional
    public CourseProgress enroll(String slug, AuthPrincipal me, String ip) {
        Course c = courseService.getVisible(slug, me);
        if (!enrollments.existsByUserIdAndCourseId(me.id(), c.getId())) {
            checkStageAccess(c, me);
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
        Map<Long, QuizProgress> quizByLesson = new HashMap<>();
        for (Quiz q : c.getQuizzes()) if (q.getLessonId() != null) qp.stream().filter(x -> x.quizId().equals(q.getId())).findFirst().ifPresent(x -> quizByLesson.put(q.getLessonId(), x));

        int totalItems = lessonIds.size() + qp.size();
        long doneItems = done.size() + qp.stream().filter(QuizProgress::passed).count();
        int percent = totalItems == 0 ? 0 : (int) Math.round(doneItems * 100.0 / totalItems);

        boolean enrolled = enrollments.existsByUserIdAndCourseId(userId, c.getId());
        String cert = certificates.findByUserIdAndCourseId(userId, c.getId()).map(Certificate::getCode).orElse(null);
        Long next = lessonIds.stream().filter(id -> !done.contains(id)).findFirst().orElse(null);

        // Ketma-ket rejim: dars ochiq, agar undan oldingi barcha darslar tugatilgan va ularning testlari (bo'lsa) topshirilgan bo'lsa
        List<Long> unlocked = new ArrayList<>();
        boolean open = true;
        for (Lesson l : c.getLessons()) {
            if (!c.isSequential()) { unlocked.add(l.getId()); continue; }
            if (open) unlocked.add(l.getId());
            QuizProgress lq = quizByLesson.get(l.getId());
            boolean lessonOk = done.contains(l.getId()) && (lq == null || lq.passed());
            open = open && lessonOk;
        }

        List<ModuleProgress> mp = moduleProgress(userId, c, done);
        CourseListItem nextStage = null;
        if (c.getStage() != null && c.getCategory() != null && totalItems > 0 && doneItems == totalItems) {
            nextStage = courses.findByCategoryIdAndStageIsNotNullOrderByStageAsc(c.getCategory().getId()).stream()
                    .filter(x -> x.isPublished() && x.getStage() == c.getStage() + 1).findFirst()
                    .map(x -> courseService.toListItem(x, courseService.stats(List.of(x.getId())).get(x.getId()))).orElse(null);
        }

        return new CourseProgress(c.getId(), enrolled, lessonIds.stream().filter(done::contains).toList(),
                lessonIds.size(), qp, percent, totalItems > 0 && doneItems == totalItems, cert, next, unlocked, mp, nextStage);
    }

    private List<ModuleProgress> moduleProgress(Long userId, Course c, Set<Long> done) {
        List<ModuleProgress> out = new ArrayList<>();
        for (CourseModule m : c.getModules()) {
            List<Lesson> ls = c.getLessons().stream().filter(l -> l.getModule() != null && l.getModule().getId().equals(m.getId())).toList();
            int completed = (int) ls.stream().filter(l -> done.contains(l.getId())).count();
            java.math.BigDecimal bestRaw = null, bestScaled = null;
            String label = null;
            long count = 0;
            if (m.getExam() != null) {
                List<Attempt> list = attempts.findByUserIdAndExamIdAndStatusInOrderByScaledScoreDescRawScoreDesc(userId, m.getExam().getId(),
                        List.of(AttemptStatus.GRADED, AttemptStatus.EXPIRED, AttemptStatus.SUBMITTED));
                count = list.size();
                if (!list.isEmpty()) {
                    Attempt best = list.get(0);
                    bestRaw = best.getRawScore();
                    bestScaled = best.getScaledScore();
                    label = AttemptService.overallLabel(bands.findByExamIdOrderBySectionIdAscMinRawAsc(m.getExam().getId()), best);
                }
            }
            out.add(new ModuleProgress(m.getId(), completed, ls.size(), bestRaw, bestScaled, label, count));
        }
        return out;
    }

    private List<QuizProgress> quizProgress(Long userId, Course c) {
        List<Quiz> qs = c.getQuizzes();
        if (qs.isEmpty()) return List.of();
        Map<Long, Object[]> best = new HashMap<>();
        for (Object[] r : quizAttempts.bestByQuiz(userId, qs.stream().map(Quiz::getId).toList())) best.put((Long) r[0], r);
        return qs.stream().map(q -> {
            Object[] r = best.get(q.getId());
            Integer score = r == null ? null : ((Number) r[1]).intValue();
            long attemptsCount = r == null ? 0 : ((Number) r[2]).longValue();
            return new QuizProgress(q.getId(), q.getTitle(), score, attemptsCount, score != null && score >= q.getPassScore());
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
                    p.progressPercent(), p.completed(), code, p.nextLessonId(), p.unlockedLessonIds(), p.modules(), p.nextStage());
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
        boolean manager = me != null && courseService.canManage(me, c);
        boolean access = l.isPreview() || (me != null && (enrollments.existsByUserIdAndCourseId(me.id(), c.getId()) || manager));
        if (!access) throw AppException.forbidden("Darsni ko'rish uchun kursga yoziling");
        if (c.isSequential() && !manager && me != null && !l.isPreview()) {
            CourseProgress p = progress(me.id(), c);
            if (!p.unlockedLessonIds().contains(l.getId())) throw AppException.forbidden("Bu dars hali ochilmagan: avval oldingi darsni tugating va testini topshiring");
        }
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
        if (c.isSequential() && !progress(userId, c).unlockedLessonIds().contains(lessonId)) throw AppException.forbidden("Bu dars hali ochilmagan");
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
        if (c.isSequential() && q.getLessonId() != null && !courseService.canManage(me, c) && !progress(me.id(), c).unlockedLessonIds().contains(q.getLessonId())) {
            throw AppException.forbidden("Bu test hali ochilmagan");
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
            String nextTitle = p.nextLessonId() == null ? null : c.getLessons().stream().filter(l -> l.getId().equals(p.nextLessonId())).map(Lesson::getTitle).findFirst().orElse(null);
            return new MyCourse(courseService.toListItem(c, st.get(c.getId())), e.getEnrolledAt(), e.getCompletedAt(),
                    p.progressPercent(), p.completedLessonIds().size(), p.totalLessons(), p.nextLessonId(), p.certificateCode(), nextTitle);
        }).toList();
    }

    public static <T, K> Map<K, T> byKey(List<T> list, Function<T, K> key) {
        return list.stream().collect(Collectors.toMap(key, Function.identity(), (a, b) -> a));
    }
}
