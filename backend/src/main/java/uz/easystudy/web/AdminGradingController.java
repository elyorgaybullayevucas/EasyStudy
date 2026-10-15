package uz.easystudy.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.AttemptDtos.GradeRequest;
import uz.easystudy.dto.AttemptDtos.GradingAttempt;
import uz.easystudy.dto.AttemptDtos.GradingRow;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.AttemptService;

import java.util.List;

/** Writing/Speaking javoblarini o'qituvchi tekshiradi. */
@RestController
@RequestMapping("/api/admin/grading")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class AdminGradingController {

    private final AttemptService attempts;

    @GetMapping
    public List<GradingRow> queue(@RequestParam(defaultValue = "false") boolean all, @AuthenticationPrincipal AuthPrincipal me) {
        return attempts.gradingQueue(me, all);
    }

    @GetMapping("/ai-status")
    public List<String> aiStatus() {
        return attempts.aiStatus();
    }

    @GetMapping("/{attemptId}")
    public GradingAttempt get(@PathVariable Long attemptId, @AuthenticationPrincipal AuthPrincipal me) {
        return attempts.gradingDetail(attemptId, me);
    }

    @PostMapping("/{attemptId}")
    public GradingAttempt grade(@PathVariable Long attemptId, @Valid @RequestBody GradeRequest r,
                                @AuthenticationPrincipal AuthPrincipal me, HttpServletRequest req) {
        return attempts.gradeManual(attemptId, r, me, req.getRemoteAddr());
    }
}
