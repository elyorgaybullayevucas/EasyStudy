package uz.easystudy.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/** Fon ishi: tranzaksiya commit bo'lgach chaqiriladi (AttemptService). */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiGradingWorker {

    private final AiGradingService service;

    @Async
    public void run(Long attemptId) {
        try {
            service.grade(attemptId);
        } catch (Exception e) {
            log.error("AI baholash xatosi, attempt={}", attemptId, e);
            service.markFailed(attemptId);
        }
    }
}
