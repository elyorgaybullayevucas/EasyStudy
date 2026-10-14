package uz.easystudy.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.LearningDtos.CourseProgress;
import uz.easystudy.dto.LearningDtos.QuizPublic;
import uz.easystudy.dto.LearningDtos.QuizResult;
import uz.easystudy.dto.LearningDtos.QuizSubmit;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.LearningService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learning;

    @PostMapping("/lessons/{lessonId}/complete")
    public CourseProgress complete(@PathVariable Long lessonId, @AuthenticationPrincipal AuthPrincipal me) {
        return learning.completeLesson(lessonId, me.id());
    }

    @DeleteMapping("/lessons/{lessonId}/complete")
    public CourseProgress uncomplete(@PathVariable Long lessonId, @AuthenticationPrincipal AuthPrincipal me) {
        return learning.uncompleteLesson(lessonId, me.id());
    }

    @GetMapping("/quizzes/{quizId}")
    public QuizPublic quiz(@PathVariable Long quizId, @AuthenticationPrincipal AuthPrincipal me) {
        return learning.quiz(quizId, me);
    }

    @PostMapping("/quizzes/{quizId}/submit")
    public QuizResult submit(@PathVariable Long quizId, @Valid @RequestBody QuizSubmit body,
                             @AuthenticationPrincipal AuthPrincipal me, HttpServletRequest req) {
        return learning.submitQuiz(quizId, body, me, req.getRemoteAddr());
    }
}
