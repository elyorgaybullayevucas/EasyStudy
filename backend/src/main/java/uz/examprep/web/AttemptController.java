package uz.examprep.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.examprep.dto.AttemptDtos.*;
import uz.examprep.security.AuthPrincipal;
import uz.examprep.service.AttemptService;

import java.util.List;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attempts;

    @PostMapping
    public AttemptView start(@AuthenticationPrincipal AuthPrincipal me,
                             @Valid @RequestBody StartAttemptRequest r, HttpServletRequest req) {
        return attempts.start(me.id(), r.examId(), req.getRemoteAddr());
    }

    @GetMapping
    public List<AttemptView> mine(@AuthenticationPrincipal AuthPrincipal me) {
        return attempts.myAttempts(me.id());
    }

    @GetMapping("/{id}")
    public AttemptView get(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Long id) {
        return attempts.get(me.id(), id);
    }

    @PutMapping("/{id}/answers")
    public ResponseEntity<Void> answer(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Long id,
                                       @Valid @RequestBody SaveAnswerRequest r) {
        attempts.saveAnswer(me.id(), id, r);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    public AttemptResult submit(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Long id, HttpServletRequest req) {
        return attempts.submit(me.id(), id, req.getRemoteAddr());
    }

    @GetMapping("/{id}/result")
    public AttemptResult result(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Long id) {
        return attempts.getResult(me.id(), id);
    }
}
