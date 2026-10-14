package uz.easystudy.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.ExamDtos.*;
import uz.easystudy.service.ExamService;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/exams")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class AdminExamController {

    private final ExamService exams;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExamSummary create(@Valid @RequestBody CreateExamRequest r) {
        return exams.createExam(r);
    }

    @PostMapping("/{examId}/sections")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> addSection(@PathVariable Long examId, @Valid @RequestBody CreateSectionRequest r) {
        return Map.of("id", exams.addSection(examId, r));
    }

    @PostMapping("/sections/{sectionId}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> addQuestion(@PathVariable Long sectionId, @Valid @RequestBody CreateQuestionRequest r) {
        return Map.of("id", exams.addQuestion(sectionId, r));
    }

    @PatchMapping("/{examId}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public void publish(@PathVariable Long examId, @RequestParam boolean published) {
        exams.setPublished(examId, published);
    }
}
