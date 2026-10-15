package uz.easystudy.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.config.AppProperties;
import uz.easystudy.domain.*;
import uz.easystudy.media.MediaService;
import uz.easystudy.repository.AnswerRepository;
import uz.easystudy.repository.AttemptRepository;
import uz.easystudy.service.AttemptService;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Writing/Speaking javoblarini AI baholaydi; natija darhol chiqadi. O'qituvchi keyin tekshirish navbatida
 * ko'rib, ballni o'zgartirishi mumkin (o'qituvchi bahosi AI bahosi ustidan yoziladi).
 * Fon ishga tushirish AiGradingWorker orqali (proxy bilan @Async va @Transactional ishlashi uchun).
 */
@Slf4j
@Service
public class AiGradingService {

    private final AiGrader grader;          // null = o'chirilgan
    private final Transcriber transcriber;  // null = yo'q
    private final AttemptRepository attempts;
    private final AnswerRepository answers;
    private final MediaService media;
    private final AttemptService attemptService;

    public AiGradingService(AppProperties props, AttemptRepository attempts, AnswerRepository answers, MediaService media, AttemptService attemptService) {
        AppProperties.Ai ai = props.ai();
        String p = ai == null || ai.provider() == null ? "none" : ai.provider().toLowerCase();
        this.grader = switch (p) {
            case "claude" -> new ClaudeGrader(ai.apiKey(), ai.model());
            case "fake" -> new FakeGrader();
            default -> null;
        };
        String tp = ai == null || ai.transcription() == null || ai.transcription().provider() == null ? "none" : ai.transcription().provider().toLowerCase();
        this.transcriber = "openai".equals(tp) ? new OpenAiWhisperTranscriber(ai.transcription().apiKey(), ai.transcription().model()) : null;
        this.attempts = attempts;
        this.answers = answers;
        this.media = media;
        this.attemptService = attemptService;
        log.info("AI tekshiruv: grader={}, transkripsiya={}", grader == null ? "yo'q" : grader.name(), transcriber == null ? "yo'q" : "openai");
    }

    public boolean enabled() {
        return grader != null;
    }

    public boolean speakingSupported() {
        return grader != null && transcriber != null && transcriber.available();
    }

    public List<String> status() {
        return List.of("grader=" + (grader == null ? "none" : grader.name()), "transcription=" + (speakingSupported() ? "on" : "off"));
    }

    @Transactional
    public void markFailed(Long attemptId) {
        attempts.findById(attemptId).ifPresent(a -> {
            a.setAiStatus(AiStatus.FAILED);
            attempts.save(a);
        });
    }

    @Transactional
    public void grade(Long attemptId) {
        Attempt a = attempts.findById(attemptId).orElseThrow();
        if (a.getStatus() != AttemptStatus.SUBMITTED) return;
        Exam exam = a.getExam();
        Map<Long, Answer> byQ = answers.findByAttemptId(a.getId()).stream().collect(Collectors.toMap(x -> x.getQuestion().getId(), Function.identity()));

        for (Section s : exam.getSections()) {
            for (Question q : s.getQuestions()) {
                if (!q.getType().isManual()) continue;
                Answer ans = byQ.get(q.getId());
                if (ans == null || ans.getPoints() != null) continue; // javob yo'q yoki allaqachon baholangan
                String text;
                if (q.getType() == QuestionType.ESSAY) {
                    Object t = ans.getResponse() == null ? null : ans.getResponse().get("text");
                    text = t == null ? "" : t.toString();
                } else {
                    text = ans.getTranscript();
                    if (text == null && transcriber != null && transcriber.available() && ans.getResponse() != null
                            && ans.getResponse().get("audioKey") instanceof String key) {
                        Resource res = media.openInternal(key);
                        text = res == null ? null : transcriber.transcribe(res, "answer.webm", languageFor(exam));
                        if (text != null) ans.setTranscript(text);
                    }
                    if (text == null) continue; // transkripsiya yo'q: Speaking o'qituvchiga qoladi
                }
                Rubrics.Rubric rubric = Rubrics.forTask(exam.getTemplateCode(), s.getPartType(), q.getPoints());
                AiGrader.Result r = grader.grade(new AiGrader.Request(exam.getTitle(), s.getTitle(), rubric.text(), q.getPrompt(),
                        text.isBlank() ? "(bo'sh javob)" : text, q.getPoints(), rubric.step(), q.getMinWords()));
                ans.setPoints(r.points());
                ans.setIsCorrect(r.points().signum() > 0);
                ans.setFeedback(r.feedback());
                ans.setAiGraded(true);
                ans.setGradedBy(null);
                ans.setUpdatedAt(Instant.now());
            }
        }
        a.setAiStatus(AiStatus.DONE);
        attemptService.recomputeAfterGrading(a);
        log.info("AI baholash tugadi: attempt={}, status={}", attemptId, a.getStatus());
    }

    private static String languageFor(Exam exam) {
        String t = exam.getTemplateCode() == null ? "" : exam.getTemplateCode().toUpperCase();
        if (t.startsWith("TOPIK")) return "ko";
        if (t.startsWith("IELTS") || t.startsWith("MILLIY_ENGLISH")) return "en";
        return null;
    }
}
