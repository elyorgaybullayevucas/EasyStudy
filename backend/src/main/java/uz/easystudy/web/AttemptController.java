package uz.easystudy.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.easystudy.dto.AttemptDtos.*;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.AttemptService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attempts;

    @PostMapping
    public AttemptView start(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody StartAttemptRequest r, HttpServletRequest req) {
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

    @PostMapping("/{id}/sections/{sectionId}/start")
    public AttemptView startSection(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Long id, @PathVariable Long sectionId) {
        return attempts.startSection(me.id(), id, sectionId);
    }

    @PostMapping("/{id}/sections/{sectionId}/finish")
    public AttemptView finishSection(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Long id, @PathVariable Long sectionId) {
        return attempts.finishSection(me.id(), id, sectionId);
    }

    @PutMapping("/{id}/answers")
    public ResponseEntity<Void> answer(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Long id, @Valid @RequestBody SaveAnswerRequest r) {
        attempts.saveAnswer(me.id(), id, r);
        return ResponseEntity.noContent().build();
    }

    /** Speaking: ovozli javob (webm/ogg/mp4/mp3). */
    @PostMapping(value = "/{id}/answers/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> audioAnswer(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Long id,
                                           @RequestParam("questionId") Long questionId, @RequestParam("file") MultipartFile file) {
        return attempts.saveAudioAnswer(me.id(), id, questionId, file);
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
