package uz.easystudy.web;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.domain.CourseLevel;
import uz.easystudy.dto.CourseDtos.CourseDetail;
import uz.easystudy.dto.CourseDtos.CourseListItem;
import uz.easystudy.dto.CourseDtos.LessonOut;
import uz.easystudy.dto.LearningDtos.CourseProgress;
import uz.easystudy.dto.PageDto;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.CourseService;
import uz.easystudy.service.LearningService;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courses;
    private final LearningService learning;

    @GetMapping
    public PageDto<CourseListItem> list(@RequestParam(required = false) String search,
                                        @RequestParam(required = false) String category,
                                        @RequestParam(required = false) CourseLevel level,
                                        @RequestParam(required = false) Boolean featured,
                                        @RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "12") int size) {
        return courses.list(search, category, level, featured, true, null, null, page, size);
    }

    @GetMapping("/{slug}")
    public CourseDetail get(@PathVariable String slug, @AuthenticationPrincipal AuthPrincipal me) {
        return courses.detail(slug, me);
    }

    @PostMapping("/{slug}/enroll")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseProgress enroll(@PathVariable String slug, @AuthenticationPrincipal AuthPrincipal me, HttpServletRequest req) {
        return learning.enroll(slug, me, req.getRemoteAddr());
    }

    @GetMapping("/{slug}/progress")
    public CourseProgress progress(@PathVariable String slug, @AuthenticationPrincipal AuthPrincipal me) {
        return learning.progress(slug, me);
    }

    @GetMapping("/{slug}/lessons/{lessonId}")
    public LessonOut lesson(@PathVariable String slug, @PathVariable Long lessonId, @AuthenticationPrincipal AuthPrincipal me) {
        return learning.lesson(slug, lessonId, me);
    }
}
