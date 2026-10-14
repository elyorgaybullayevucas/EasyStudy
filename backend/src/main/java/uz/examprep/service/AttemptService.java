package uz.examprep.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.examprep.domain.*;
import uz.examprep.dto.AttemptDtos.*;
import uz.examprep.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final AttemptRepository attempts;
    private final AnswerRepository answers;
    private final ExamRepository exams;
    private final QuestionRepository questions;
    private final UserRepository users;
    private final BandConversionRepository bands;
    private final GradingService grading;
    private final AuditService audit;

    @Transactional
    public AttemptView start(Long userId, Long examId, String ip) {
        Exam exam = exams.findByIdAndPublishedTrue(examId).orElseThrow(() -> AppException.notFound("Imtihon topilmadi"));
        // Davom etayotgan urinish bo'lsa, shuni qaytaramiz (ikkinchi oynada qayta boshlashni oldini olish)
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
        a.setExpiresAt(Instant.now().plusSeconds(minutes * 60L + 30)); // 30 soniya tarmoq uchun zaxira
        attempts.save(a);
        audit.log(userId, "ATTEMPT_START", "exam:" + examId, ip);
        return toView(a);
    }

    @Transactional
    public void saveAnswer(Long userId, Long attemptId, SaveAnswerRequest r) {
        Attempt a = owned(userId, attemptId);
        ensureOpen(a);
        Question q = questions.findById(r.questionId()).orElseThrow(() -> AppException.notFound("Savol topilmadi"));
        if (!q.getSection().getExam().getId().equals(a.getExam().getId())) {
            throw AppException.badRequest("Savol bu imtihonga tegishli emas");
        }
        Answer ans = answers.findByAttemptIdAndQuestionId(attemptId, q.getId()).orElseGet(() -> {
            Answer n = new Answer();
            n.setAttempt(a);
            n.setQuestion(q);
            return n;
        });
        ans.setResponse(sanitise(r.response()));
        ans.setUpdatedAt(Instant.now());
        answers.save(ans);
    }

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

    // ---------------- internals ----------------

    private Attempt owned(Long userId, Long attemptId) {
        return attempts.findByIdAndUserId(attemptId, userId).orElseThrow(() -> AppException.notFound("Urinish topilmadi"));
    }

    private void ensureOpen(Attempt a) {
        if (a.getStatus() != AttemptStatus.IN_PROGRESS) throw AppException.conflict("Urinish yakunlangan");
        if (a.getExpiresAt().isBefore(Instant.now())) {
            expire(a);
            throw AppException.conflict("Vaqt tugadi");
        }
    }

    /** Vaqt tugagan urinish: mavjud javoblar bilan avtomatik baholanadi. */
    private void expire(Attempt a) {
        grade(a);
        a.setStatus(a.getStatus() == AttemptStatus.GRADED ? AttemptStatus.GRADED : AttemptStatus.EXPIRED);
    }

    private void grade(Attempt a) {
        List<Question> qs = questions.findAllByExamId(a.getExam().getId());
        Map<Long, Answer> byQ = answers.findByAttemptId(a.getId()).stream()
                .collect(Collectors.toMap(x -> x.getQuestion().getId(), Function.identity()));

        BigDecimal raw = BigDecimal.ZERO;
        boolean needsManual = false;
        for (Question q : qs) {
            Answer ans = byQ.get(q.getId());
            if (q.getType() == QuestionType.ESSAY) { needsManual = true; continue; }
            boolean ok = ans != null && Boolean.TRUE.equals(grading.isCorrect(q, ans.getResponse()));
            if (ans != null) {
                ans.setIsCorrect(ok);
                ans.setPoints(ok ? q.getPoints() : BigDecimal.ZERO);
            }
            if (ok) raw = raw.add(q.getPoints());
        }
        a.setRawScore(raw);
        a.setScaledScore(bands.findFirstByExamIdAndMinRawLessThanEqualAndMaxRawGreaterThanEqual(
                        a.getExam().getId(), raw.intValue(), raw.intValue())
                .map(BandConversion::getScaled).orElse(null));
        a.setSubmittedAt(Instant.now());
        a.setStatus(needsManual ? AttemptStatus.SUBMITTED : AttemptStatus.GRADED);
    }

    private AttemptResult result(Attempt a) {
        List<Question> qs = questions.findAllByExamId(a.getExam().getId());
        BigDecimal max = qs.stream().map(Question::getPoints).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<Long, Answer> byQ = answers.findByAttemptId(a.getId()).stream()
                .collect(Collectors.toMap(x -> x.getQuestion().getId(), Function.identity()));
        List<AnswerResult> rows = qs.stream().map(q -> {
            Answer ans = byQ.get(q.getId());
            return new AnswerResult(q.getId(), ans == null ? null : ans.getResponse(),
                    ans == null ? Boolean.FALSE : ans.getIsCorrect(), ans == null ? BigDecimal.ZERO : ans.getPoints());
        }).toList();
        return new AttemptResult(a.getId(), a.getExam().getId(), a.getExam().getTitle(), a.getStatus(),
                a.getRawScore(), max.setScale(2, RoundingMode.HALF_UP), a.getScaledScore(), rows);
    }

    private AttemptView toView(Attempt a) {
        Map<Long, Map<String, Object>> ans = answers.findByAttemptId(a.getId()).stream()
                .collect(Collectors.toMap(x -> x.getQuestion().getId(), Answer::getResponse));
        return new AttemptView(a.getId(), a.getExam().getId(), a.getExam().getTitle(), a.getStatus(),
                a.getStartedAt(), a.getExpiresAt(), a.getSubmittedAt(), a.getRawScore(), a.getScaledScore(), ans);
    }

    /** Faqat kutilgan kalitlar va cheklangan uzunlik; JSON bomb / HTML inyeksiya oldini olish. */
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
