package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.easystudy.domain.*;
import uz.easystudy.dto.AttemptDtos.*;
import uz.easystudy.media.MediaService;
import uz.easystudy.repository.*;
import uz.easystudy.security.AuthPrincipal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Mock imtihon urinishi: bo'limlar ketma-ket ochiladi (har birining o'z taymeri), javoblar faqat ochiq bo'limda
 * qabul qilinadi, topshirilgach avtomatik baholanadi; Writing/Speaking o'qituvchi tekshirgach yakunlanadi.
 */
@Service
@RequiredArgsConstructor
public class AttemptService {

    private final AttemptRepository attempts;
    private final AttemptSectionRepository attemptSections;
    private final AnswerRepository answers;
    private final ExamRepository exams;
    private final QuestionRepository questions;
    private final UserRepository users;
    private final BandConversionRepository bands;
    private final GradingService grading;
    private final AuditService audit;
    private final MediaService media;
    private final ExamService examService;
    private final org.springframework.beans.factory.ObjectProvider<uz.easystudy.ai.AiGradingService> aiGrading; // sikl bog'liqlikni oldini olish
    private final org.springframework.beans.factory.ObjectProvider<uz.easystudy.ai.AiGradingWorker> aiWorker;

    // ---------------- boshlash ----------------

    @Transactional
    public AttemptView start(Long userId, Long examId, String ip) {
        Exam exam = exams.findByIdAndPublishedTrue(examId).orElseThrow(() -> AppException.notFound("Imtihon topilmadi"));
        Optional<Attempt> existing = attempts.findFirstByUserIdAndExamIdAndStatus(userId, examId, AttemptStatus.IN_PROGRESS);
        if (existing.isPresent()) {
            Attempt a = existing.get();
            if (a.getExpiresAt().isAfter(Instant.now())) return toView(a);
            expire(a);
        }
        int minutes = exam.getSections().stream().mapToInt(Section::getDurationMinutes).sum();
        Attempt a = new Attempt();
        a.setUser(users.getReferenceById(userId));
        a.setExam(exam);
        Instant now = Instant.now();
        if (exam.getNavigationMode() == NavigationMode.FREE) {
            // DTM kabi: barcha bo'limlar bir vaqtda ochiladi, yagona taymer
            Instant ends = now.plusSeconds(minutes * 60L + 5);
            a.setExpiresAt(ends);
            attempts.save(a);
            for (Section s : exam.getSections()) {
                AttemptSection st = new AttemptSection();
                st.setAttemptId(a.getId());
                st.setSectionId(s.getId());
                st.setEndsAt(ends);
                attemptSections.save(st);
            }
        } else {
            // Yuqori chegara: barcha bo'limlar + bo'limlar orasidagi tanaffuslar uchun 15 daqiqa
            a.setExpiresAt(now.plusSeconds(minutes * 60L + 15 * 60L));
            attempts.save(a);
        }
        audit.log(userId, "ATTEMPT_START", "exam:" + examId, ip);
        return toView(a);
    }

    /** Navbatdagi bo'limni ochadi: oldingi bo'limlar yakunlangan bo'lishi shart. */
    @Transactional
    public AttemptView startSection(Long userId, Long attemptId, Long sectionId) {
        Attempt a = owned(userId, attemptId);
        ensureInProgress(a);
        List<Section> secs = a.getExam().getSections();
        Section target = secs.stream().filter(s -> s.getId().equals(sectionId)).findFirst()
                .orElseThrow(() -> AppException.notFound("Bo'lim topilmadi"));
        Map<Long, AttemptSection> states = states(a.getId());
        if (states.containsKey(sectionId)) return toView(a);
        Instant now = Instant.now();
        for (Section s : secs) {
            if (s.getId().equals(sectionId)) break;
            AttemptSection st = states.get(s.getId());
            if (st == null) throw AppException.conflict("Avval \"" + s.getTitle() + "\" bo'limini yakunlang");
            if (st.isOpen(now)) {
                st.setFinishedAt(now); // oldingi bo'lim avtomatik yakunlanadi
            }
        }
        AttemptSection st = new AttemptSection();
        st.setAttemptId(a.getId());
        st.setSectionId(target.getId());
        st.setEndsAt(now.plusSeconds(target.getDurationMinutes() * 60L + 5)); // 5 soniya tarmoq zaxirasi
        attemptSections.save(st);
        return toView(a);
    }

    @Transactional
    public AttemptView finishSection(Long userId, Long attemptId, Long sectionId) {
        Attempt a = owned(userId, attemptId);
        ensureInProgress(a);
        if (a.getExam().getNavigationMode() == NavigationMode.FREE) return toView(a); // erkin rejimda bo'limlar alohida yopilmaydi
        AttemptSection st = attemptSections.findByAttemptIdAndSectionId(a.getId(), sectionId)
                .orElseThrow(() -> AppException.conflict("Bo'lim boshlanmagan"));
        if (st.getFinishedAt() == null) st.setFinishedAt(Instant.now());
        // Oxirgi bo'lim yakunlansa, urinish avtomatik topshiriladi
        List<Section> secs = a.getExam().getSections();
        boolean last = !secs.isEmpty() && secs.get(secs.size() - 1).getId().equals(sectionId);
        if (last) grade(a);
        return toView(a);
    }

    // ---------------- javoblar ----------------

    @Transactional
    public void saveAnswer(Long userId, Long attemptId, SaveAnswerRequest r) {
        Attempt a = owned(userId, attemptId);
        ensureInProgress(a);
        Question q = questions.findById(r.questionId()).orElseThrow(() -> AppException.notFound("Savol topilmadi"));
        ensureSectionOpen(a, q);
        upsert(a, q, sanitise(r.response()));
    }

    /** Speaking: talaba ovozli javobni yuklaydi; fayl platformada saqlanadi, javob = {audioKey}. */
    @Transactional
    public Map<String, Object> saveAudioAnswer(Long userId, Long attemptId, Long questionId, MultipartFile file) {
        Attempt a = owned(userId, attemptId);
        ensureInProgress(a);
        Question q = questions.findById(questionId).orElseThrow(() -> AppException.notFound("Savol topilmadi"));
        if (q.getType() != QuestionType.SPEAKING) throw AppException.badRequest("Bu savol ovozli javob qabul qilmaydi");
        ensureSectionOpen(a, q);
        String key = media.upload(file, MediaService.Kind.AUDIO);
        Answer prev = answers.findByAttemptIdAndQuestionId(a.getId(), q.getId()).orElse(null);
        if (prev != null && prev.getResponse() != null && prev.getResponse().get("audioKey") instanceof String old) media.delete(old);
        Map<String, Object> resp = Map.of("audioKey", key);
        upsert(a, q, resp);
        return Map.of("audioKey", key, "audioUrl", media.url(key));
    }

    private void upsert(Attempt a, Question q, Map<String, Object> response) {
        Answer ans = answers.findByAttemptIdAndQuestionId(a.getId(), q.getId()).orElseGet(() -> {
            Answer n = new Answer();
            n.setAttempt(a);
            n.setQuestion(q);
            return n;
        });
        ans.setResponse(response);
        ans.setUpdatedAt(Instant.now());
        answers.save(ans);
    }

    private void ensureSectionOpen(Attempt a, Question q) {
        Section s = q.getSection();
        if (!s.getExam().getId().equals(a.getExam().getId())) throw AppException.badRequest("Savol bu imtihonga tegishli emas");
        AttemptSection st = attemptSections.findByAttemptIdAndSectionId(a.getId(), s.getId())
                .orElseThrow(() -> AppException.conflict("Bo'lim hali boshlanmagan"));
        if (!st.isOpen(Instant.now())) throw AppException.conflict("Bu bo'limning vaqti tugagan");
    }

    // ---------------- topshirish va baholash ----------------

    @Transactional
    public AttemptResult submit(Long userId, Long attemptId, String ip) {
        Attempt a = owned(userId, attemptId);
        if (a.getStatus() != AttemptStatus.IN_PROGRESS) throw AppException.conflict("Urinish allaqachon yakunlangan");
        grade(a);
        audit.log(userId, "ATTEMPT_SUBMIT", "attempt:" + attemptId, ip);
        return result(a);
    }

    @Transactional
    public AttemptView get(Long userId, Long attemptId) {
        Attempt a = owned(userId, attemptId);
        if (a.getStatus() == AttemptStatus.IN_PROGRESS && a.getExpiresAt().isBefore(Instant.now())) expire(a);
        return toView(a);
    }

    @Transactional(readOnly = true)
    public AttemptResult getResult(Long userId, Long attemptId) {
        Attempt a = owned(userId, attemptId);
        if (a.getStatus() == AttemptStatus.IN_PROGRESS) throw AppException.conflict("Urinish hali yakunlanmagan");
        return result(a);
    }

    @Transactional(readOnly = true)
    public List<AttemptView> myAttempts(Long userId) {
        return attempts.findByUserIdOrderByStartedAtDesc(userId).stream().map(this::toView).toList();
    }

    private Attempt owned(Long userId, Long attemptId) {
        return attempts.findByIdAndUserId(attemptId, userId).orElseThrow(() -> AppException.notFound("Urinish topilmadi"));
    }

    private void ensureInProgress(Attempt a) {
        if (a.getStatus() != AttemptStatus.IN_PROGRESS) throw AppException.conflict("Urinish yakunlangan");
        if (a.getExpiresAt().isBefore(Instant.now())) {
            expire(a);
            throw AppException.conflict("Imtihon vaqti tugadi");
        }
    }

    private void expire(Attempt a) {
        grade(a);
        if (a.getStatus() == AttemptStatus.GRADED) a.setStatus(AttemptStatus.EXPIRED);
    }

    private Map<Long, AttemptSection> states(Long attemptId) {
        return attemptSections.findByAttemptId(attemptId).stream().collect(Collectors.toMap(AttemptSection::getSectionId, Function.identity()));
    }

    /** Avtomatik baholash + bo'lim va umumiy natija. Qo'lda tekshiriladigan savollar bo'lsa SUBMITTED. */
    private void grade(Attempt a) {
        Map<Long, Answer> byQ = answers.findByAttemptId(a.getId()).stream().collect(Collectors.toMap(x -> x.getQuestion().getId(), Function.identity()));
        for (Section s : a.getExam().getSections()) {
            for (Question q : s.getQuestions()) {
                if (q.getType().isManual()) continue;
                Answer ans = byQ.get(q.getId());
                boolean ok = ans != null && Boolean.TRUE.equals(grading.isCorrect(q, ans.getResponse()));
                if (ans != null) {
                    ans.setIsCorrect(ok);
                    ans.setPoints(ok ? q.getPoints() : BigDecimal.ZERO);
                }
            }
        }
        boolean pending = recompute(a, byQ);
        a.setSubmittedAt(Instant.now());
        a.setStatus(pending ? AttemptStatus.SUBMITTED : AttemptStatus.GRADED);
        for (AttemptSection st : attemptSections.findByAttemptId(a.getId())) if (st.getFinishedAt() == null) st.setFinishedAt(Instant.now());
        if (pending) {
            uz.easystudy.ai.AiGradingService ai = aiGrading.getIfAvailable();
            uz.easystudy.ai.AiGradingWorker worker = aiWorker.getIfAvailable();
            if (ai != null && ai.enabled() && worker != null) {
                a.setAiStatus(AiStatus.PENDING);
                final Long id = a.getId();
                // Commit'dan keyin fonda: aks holda worker hali yozilmagan ma'lumotni o'qiydi
                if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
                    org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                            new org.springframework.transaction.support.TransactionSynchronization() {
                                @Override public void afterCommit() { worker.run(id); }
                            });
                } else {
                    worker.run(id);
                }
            }
        }
    }

    /** AI yoki o'qituvchi baholagach: bo'lim va umumiy natijani qayta hisoblash, holatni yangilash. */
    public void recomputeAfterGrading(Attempt a) {
        Map<Long, Answer> byQ = answers.findByAttemptId(a.getId()).stream().collect(Collectors.toMap(x -> x.getQuestion().getId(), Function.identity()));
        boolean pending = recompute(a, byQ);
        if (!pending && a.getStatus() == AttemptStatus.SUBMITTED) a.setStatus(AttemptStatus.GRADED);
    }

    /** Bo'lim va umumiy ballarni hisoblaydi. @return qo'lda tekshirilmagan savol qolganmi */
    private boolean recompute(Attempt a, Map<Long, Answer> byQ) {
        Instant now = Instant.now();
        Map<Long, AttemptSection> states = states(a.getId());
        List<BandConversion> all = bands.findByExamIdOrderBySectionIdAscMinRawAsc(a.getExam().getId());
        boolean pending = false;
        List<BigDecimal> sectionScaled = new ArrayList<>();
        BigDecimal totalRaw = BigDecimal.ZERO;

        for (Section s : a.getExam().getSections()) {
            BigDecimal raw = BigDecimal.ZERO, max = BigDecimal.ZERO, weighted = BigDecimal.ZERO, weightSum = BigDecimal.ZERO;
            boolean manual = ExamService.isManual(s), sectionPending = false;
            for (Question q : s.getQuestions()) {
                max = max.add(q.getPoints());
                Answer ans = byQ.get(q.getId());
                if (q.getType().isManual()) {
                    if (ans != null && ans.getPoints() == null) sectionPending = true;
                    BigDecimal p = ans == null || ans.getPoints() == null ? BigDecimal.ZERO : ans.getPoints();
                    raw = raw.add(p);
                    weighted = weighted.add(p.multiply(q.getWeight()));
                    weightSum = weightSum.add(q.getWeight());
                } else if (ans != null && ans.getPoints() != null) {
                    raw = raw.add(ans.getPoints());
                }
            }
            pending |= sectionPending;
            BigDecimal scaled;
            List<BandConversion> table = all.stream().filter(b -> s.getId().equals(b.getSectionId())).toList();
            if (!table.isEmpty()) scaled = lookup(table, raw);
            else if (manual) scaled = weightSum.signum() == 0 ? null : roundHalf(weighted.divide(weightSum, 4, RoundingMode.HALF_UP));
            else scaled = raw;
            if (sectionPending) scaled = null;

            AttemptSection st = states.get(s.getId());
            if (st == null) {
                st = new AttemptSection();
                st.setAttemptId(a.getId());
                st.setSectionId(s.getId());
                st.setEndsAt(now);
                st.setFinishedAt(now);
                attemptSections.save(st);
            }
            st.setRawScore(raw);
            st.setMaxScore(max);
            st.setScaledScore(scaled);
            if (scaled != null) sectionScaled.add(scaled);
            totalRaw = totalRaw.add(raw);
        }

        a.setRawScore(totalRaw);
        List<BandConversion> overall = all.stream().filter(b -> b.getSectionId() == null).toList();
        BigDecimal result = null;
        if (!pending) {
            switch (a.getExam().getScoringMode()) {
                case SECTION_AVERAGE -> {
                    if (!sectionScaled.isEmpty()) {
                        BigDecimal avg = sectionScaled.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                                .divide(BigDecimal.valueOf(sectionScaled.size()), 4, RoundingMode.HALF_UP);
                        result = overall.isEmpty() ? roundHalf(avg) : lookup(overall, avg);
                    }
                }
                case SECTION_SUM -> result = sectionScaled.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                case TOTAL -> result = overall.isEmpty() ? totalRaw : lookup(overall, totalRaw);
            }
        }
        a.setScaledScore(result);
        return pending;
    }

    private static BigDecimal lookup(List<BandConversion> table, BigDecimal raw) {
        int r = raw.setScale(0, RoundingMode.HALF_UP).intValue();
        return table.stream().filter(b -> b.getMinRaw() <= r && r <= b.getMaxRaw()).map(BandConversion::getScaled).findFirst().orElse(null);
    }

    private static String label(List<BandConversion> table, BigDecimal value) {
        if (value == null) return null;
        int r = value.setScale(0, RoundingMode.HALF_UP).intValue();
        return table.stream().filter(b -> b.getSectionId() == null && b.getMinRaw() <= r && r <= b.getMaxRaw())
                .map(BandConversion::getLabel).filter(Objects::nonNull).findFirst().orElse(null);
    }

    /** IELTS qoidasi: .25 -> .5, .75 -> keyingi butun. */
    static BigDecimal roundHalf(BigDecimal x) {
        double v = x.doubleValue();
        double floor = Math.floor(v);
        double frac = v - floor;
        double out = frac < 0.25 ? floor : frac < 0.75 ? floor + 0.5 : floor + 1;
        return BigDecimal.valueOf(out).setScale(1, RoundingMode.HALF_UP);
    }

    // ---------------- o'qituvchi tekshiruvi ----------------

    /** Admin uchun: AI tekshiruv holati. */
    public List<String> aiStatus() {
        uz.easystudy.ai.AiGradingService ai = aiGrading.getIfAvailable();
        return ai == null ? List.of("grader=none") : ai.status();
    }

    @Transactional(readOnly = true)
    public List<GradingRow> gradingQueue(AuthPrincipal me, boolean includeGraded) {
        List<AttemptStatus> statuses = includeGraded ? List.of(AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.EXPIRED) : List.of(AttemptStatus.SUBMITTED);
        Long owner = me.role() == Role.ADMIN ? null : me.id();
        return attempts.findForGrading(statuses, owner).stream().filter(a -> hasManual(a.getExam())).map(this::gradingRow).toList();
    }

    private static boolean hasManual(Exam e) {
        return e.getSections().stream().flatMap(s -> s.getQuestions().stream()).anyMatch(q -> q.getType().isManual());
    }

    private GradingRow gradingRow(Attempt a) {
        List<Answer> list = answers.findByAttemptId(a.getId());
        long pending = list.stream().filter(x -> x.getQuestion().getType().isManual() && x.getPoints() == null).count();
        boolean ai = list.stream().anyMatch(Answer::isAiGraded);
        return new GradingRow(a.getId(), a.getExam().getId(), a.getExam().getTitle(), a.getUser().getFullName(), a.getUser().getEmail(),
                a.getSubmittedAt(), a.getStatus(), (int) pending, ai, a.getAiStatus());
    }

    private Attempt managedAttempt(Long attemptId, AuthPrincipal me) {
        Attempt a = attempts.findById(attemptId).orElseThrow(() -> AppException.notFound("Urinish topilmadi"));
        if (!examService.canManage(me, a.getExam())) throw AppException.forbidden("Bu imtihonni tekshirishga ruxsat yo'q");
        return a;
    }

    @Transactional(readOnly = true)
    public GradingAttempt gradingDetail(Long attemptId, AuthPrincipal me) {
        Attempt a = managedAttempt(attemptId, me);
        Map<Long, Answer> byQ = answers.findByAttemptId(a.getId()).stream().collect(Collectors.toMap(x -> x.getQuestion().getId(), Function.identity()));
        List<GradingQuestion> qs = new ArrayList<>();
        for (Section s : a.getExam().getSections()) {
            for (Question q : s.getQuestions()) {
                if (!q.getType().isManual()) continue;
                Answer ans = byQ.get(q.getId());
                String audio = ans != null && ans.getResponse() != null && ans.getResponse().get("audioKey") instanceof String k ? media.url(k) : null;
                qs.add(new GradingQuestion(q.getId(), s.getId(), s.getTitle(), q.getType(), q.getPrompt(), q.getPoints(),
                        ans == null ? null : ans.getResponse(), audio, ans == null ? null : ans.getPoints(), ans == null ? null : ans.getFeedback(),
                        ans != null && ans.isAiGraded(), ans == null ? null : ans.getTranscript()));
            }
        }
        return new GradingAttempt(gradingRow(a), qs);
    }

    @Transactional
    public GradingAttempt gradeManual(Long attemptId, GradeRequest req, AuthPrincipal me, String ip) {
        Attempt a = managedAttempt(attemptId, me);
        if (a.getStatus() == AttemptStatus.IN_PROGRESS) throw AppException.conflict("Talaba hali topshirmagan");
        Map<Long, Answer> byQ = answers.findByAttemptId(a.getId()).stream().collect(Collectors.toMap(x -> x.getQuestion().getId(), Function.identity()));
        Map<Long, Question> qById = a.getExam().getSections().stream().flatMap(s -> s.getQuestions().stream())
                .collect(Collectors.toMap(Question::getId, Function.identity()));
        for (GradeItem it : req.items()) {
            Question q = qById.get(it.questionId());
            if (q == null || !q.getType().isManual()) throw AppException.badRequest("Savol qo'lda baholanmaydi: " + it.questionId());
            if (it.points().signum() < 0 || it.points().compareTo(q.getPoints()) > 0) throw AppException.badRequest("Ball 0 va " + q.getPoints() + " oralig'ida bo'lishi kerak");
            Answer ans = byQ.get(q.getId());
            if (ans == null) { // javob bermagan bo'lsa ham 0 bilan yopish mumkin
                ans = new Answer();
                ans.setAttempt(a);
                ans.setQuestion(q);
                ans.setResponse(Map.of());
                byQ.put(q.getId(), ans);
            }
            ans.setPoints(it.points());
            ans.setIsCorrect(it.points().signum() > 0);
            ans.setFeedback(it.feedback());
            ans.setGradedBy(me.id());
            ans.setAiGraded(false); // o'qituvchi bahosi AI bahosi ustidan yoziladi
            ans.setUpdatedAt(Instant.now());
            answers.save(ans);
        }
        boolean pending = recompute(a, byQ);
        if (!pending && a.getStatus() == AttemptStatus.SUBMITTED) a.setStatus(AttemptStatus.GRADED);
        audit.log(me.id(), "ATTEMPT_GRADE", "attempt:" + attemptId, ip);
        return gradingDetail(attemptId, me);
    }

    // ---------------- DTO ----------------

    private AttemptResult result(Attempt a) {
        Map<Long, Answer> byQ = answers.findByAttemptId(a.getId()).stream().collect(Collectors.toMap(x -> x.getQuestion().getId(), Function.identity()));
        Map<Long, AttemptSection> states = states(a.getId());
        List<SectionResult> secs = new ArrayList<>();
        List<AnswerResult> rows = new ArrayList<>();
        BigDecimal max = BigDecimal.ZERO;
        int pendingCount = 0;
        for (Section s : a.getExam().getSections()) {
            AttemptSection st = states.get(s.getId());
            boolean secPending = false;
            int correct = 0;
            for (Question q : s.getQuestions()) {
                max = max.add(q.getPoints());
                Answer ans = byQ.get(q.getId());
                boolean pending = q.getType().isManual() && ans != null && ans.getPoints() == null;
                if (pending) { pendingCount++; secPending = true; }
                if (ans != null && Boolean.TRUE.equals(ans.getIsCorrect()) && !q.getType().isManual()) correct++;
                String audio = ans != null && ans.getResponse() != null && ans.getResponse().get("audioKey") instanceof String k ? media.url(k) : null;
                rows.add(new AnswerResult(q.getId(), s.getId(), q.getType(), ans == null ? null : ans.getResponse(),
                        ans == null ? (q.getType().isManual() ? null : Boolean.FALSE) : ans.getIsCorrect(),
                        ans == null ? BigDecimal.ZERO : ans.getPoints(), q.getPoints(), ans == null ? null : ans.getFeedback(), audio, pending,
                        ans != null && ans.isAiGraded()));
            }
            secs.add(new SectionResult(s.getId(), s.getTitle(), s.getPartType(), st == null ? null : st.getRawScore(),
                    st == null ? null : st.getMaxScore(), st == null ? null : st.getScaledScore(), secPending,
                    s.getQuestions().size(), correct, s.getDefaultPoints()));
        }
        List<BandConversion> all = bands.findByExamIdOrderBySectionIdAscMinRawAsc(a.getExam().getId());
        BigDecimal labelKey = a.getExam().getScoringMode() == ScoringMode.TOTAL ? a.getRawScore() : a.getScaledScore();
        String label = label(all, labelKey);
        String tpl = a.getExam().getTemplateCode();
        if (label == null && tpl != null && tpl.startsWith("IELTS")) label = ieltsCefr(a.getScaledScore());
        return new AttemptResult(a.getId(), a.getExam().getId(), a.getExam().getTitle(), a.getExam().getScoringMode(), tpl,
                a.getStatus(), a.getSubmittedAt(), a.getUser().getFullName(),
                a.getRawScore(), max.setScale(2, RoundingMode.HALF_UP), a.getScaledScore(), label, pendingCount, a.getAiStatus(), secs, rows);
    }

    /** IELTS Test Report Form'dagi CEFR darajasi (rasmiy moslik). */
    static String ieltsCefr(BigDecimal band) {
        if (band == null) return null;
        double b = band.doubleValue();
        if (b >= 8.5) return "CEFR C2";
        if (b >= 7.0) return "CEFR C1";
        if (b >= 5.5) return "CEFR B2";
        if (b >= 4.0) return "CEFR B1";
        return "CEFR A2 va past";
    }

    private AttemptView toView(Attempt a) {
        Instant now = Instant.now();
        Map<Long, AttemptSection> states = states(a.getId());
        List<SectionState> secs = new ArrayList<>();
        Long current = null;
        for (Section s : a.getExam().getSections()) {
            AttemptSection st = states.get(s.getId());
            String status = st == null ? "LOCKED" : st.isOpen(now) ? "OPEN" : "FINISHED";
            if ("OPEN".equals(status) && current == null) current = s.getId();
            secs.add(new SectionState(s.getId(), s.getTitle(), s.getPartType(), s.getOrderIndex(), s.getDurationMinutes(),
                    s.getQuestions().size(), st == null ? null : st.getStartedAt(), st == null ? null : st.getEndsAt(),
                    st == null ? null : st.getFinishedAt(), status));
        }
        Map<Long, Map<String, Object>> ans = answers.findByAttemptId(a.getId()).stream()
                .collect(Collectors.toMap(x -> x.getQuestion().getId(), x -> {
                    Map<String, Object> r = new LinkedHashMap<>(x.getResponse());
                    if (r.get("audioKey") instanceof String k) r.put("audioUrl", media.url(k));
                    return r;
                }));
        return new AttemptView(a.getId(), a.getExam().getId(), a.getExam().getTitle(), a.getExam().getScoringMode(),
                a.getExam().getNavigationMode(), a.getExam().getTemplateCode(), a.getStatus(),
                a.getStartedAt(), a.getExpiresAt(), a.getSubmittedAt(), a.getRawScore(), a.getScaledScore(), secs, current, ans);
    }

    /** Faqat kutilgan kalitlar va cheklangan uzunlik. */
    private static Map<String, Object> sanitise(Map<String, Object> in) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (String k : List.of("value", "values", "text")) {
            Object v = in.get(k);
            if (v == null) continue;
            if (v instanceof String s) {
                if (s.length() > 20_000) throw AppException.badRequest("Javob juda uzun");
                out.put(k, s);
            } else if (v instanceof Collection<?> c) {
                if (c.size() > 50) throw AppException.badRequest("Juda ko'p variant");
                out.put(k, c.stream().map(String::valueOf).map(s -> s.length() > 200 ? s.substring(0, 200) : s).toList());
            }
        }
        if (out.isEmpty()) throw AppException.badRequest("Javob formati noto'g'ri");
        return out;
    }
}
