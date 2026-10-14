package uz.easystudy.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.ExamDtos.*;
import uz.easystudy.service.ExamService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/exams")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class AdminExamController {

    private final ExamService exams;

    @GetMapping
    public List<ExamSummary> list() {
        return exams.adminList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExamAdminDetail create(@Valid @RequestBody ExamInput r) {
        return exams.createExam(r);
    }

    @GetMapping("/{examId}")
    public ExamAdminDetail get(@PathVariable Long examId) {
        return exams.adminDetail(examId);
    }

    @PutMapping("/{examId}")
    public ExamAdminDetail update(@PathVariable Long examId, @Valid @RequestBody ExamInput r) {
        return exams.updateExam(examId, r);
    }

    @DeleteMapping("/{examId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long examId) {
        exams.deleteExam(examId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{examId}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public void publish(@PathVariable Long examId, @RequestParam boolean published) {
        exams.setPublished(examId, published);
    }

    @PutMapping("/{examId}/bands")
    public ExamAdminDetail bands(@PathVariable Long examId, @Valid @RequestBody BandsInput r) {
        exams.setBands(examId, r.bands());
        return exams.adminDetail(examId);
    }

    // ---------- bo'limlar ----------

    @PostMapping("/{examId}/sections")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> addSection(@PathVariable Long examId, @Valid @RequestBody SectionInput r) {
        return Map.of("id", exams.addSection(examId, r));
    }

    @PutMapping("/sections/{sectionId}")
    public ResponseEntity<Void> updateSection(@PathVariable Long sectionId, @Valid @RequestBody SectionInput r) {
        exams.updateSection(sectionId, r);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sections/{sectionId}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long sectionId) {
        exams.deleteSection(sectionId);
        return ResponseEntity.noContent().build();
    }

    // ---------- savollar ----------

    @PostMapping("/sections/{sectionId}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> addQuestion(@PathVariable Long sectionId, @Valid @RequestBody QuestionInput r) {
        return Map.of("id", exams.addQuestion(sectionId, r));
    }

    @PutMapping("/questions/{questionId}")
    public ResponseEntity<Void> updateQuestion(@PathVariable Long questionId, @Valid @RequestBody QuestionInput r) {
        exams.updateQuestion(questionId, r);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        exams.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}
