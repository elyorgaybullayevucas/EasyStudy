package uz.easystudy.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.ExamDtos.*;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.ExamService;
import uz.easystudy.service.ExamTemplates;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/exams")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class AdminExamController {

    private final ExamService exams;

    @GetMapping
    public List<ExamSummary> list(@AuthenticationPrincipal AuthPrincipal me) {
        return exams.adminList(me);
    }

    @GetMapping("/templates")
    public List<TemplateInfo> templates() {
        return ExamTemplates.infos();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExamAdminDetail create(@Valid @RequestBody ExamInput r, @AuthenticationPrincipal AuthPrincipal me) {
        return exams.createExam(r, me);
    }

    @PostMapping("/from-template/{code}")
    @ResponseStatus(HttpStatus.CREATED)
    public ExamAdminDetail fromTemplate(@PathVariable String code, @Valid @RequestBody ExamInput r, @AuthenticationPrincipal AuthPrincipal me) {
        return exams.createFromTemplate(code, r, me);
    }

    @GetMapping("/{examId}")
    public ExamAdminDetail get(@PathVariable Long examId, @AuthenticationPrincipal AuthPrincipal me) {
        return exams.adminDetail(examId, me);
    }

    @PutMapping("/{examId}")
    public ExamAdminDetail update(@PathVariable Long examId, @Valid @RequestBody ExamInput r, @AuthenticationPrincipal AuthPrincipal me) {
        return exams.updateExam(examId, r, me);
    }

    @DeleteMapping("/{examId}")
    public ResponseEntity<Void> delete(@PathVariable Long examId, @AuthenticationPrincipal AuthPrincipal me) {
        exams.deleteExam(examId, me);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{examId}/publish")
    public void publish(@PathVariable Long examId, @RequestParam boolean published, @AuthenticationPrincipal AuthPrincipal me) {
        exams.setPublished(examId, published, me);
    }

    @PutMapping("/{examId}/bands")
    public ExamAdminDetail overallBands(@PathVariable Long examId, @Valid @RequestBody BandsInput r, @AuthenticationPrincipal AuthPrincipal me) {
        exams.setOverallBands(examId, r.bands(), me);
        return exams.adminDetail(examId, me);
    }

    // ---------- bo'limlar ----------

    @PostMapping("/{examId}/sections")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> addSection(@PathVariable Long examId, @Valid @RequestBody SectionInput r, @AuthenticationPrincipal AuthPrincipal me) {
        return Map.of("id", exams.addSection(examId, r, me));
    }

    @PutMapping("/sections/{sectionId}")
    public ResponseEntity<Void> updateSection(@PathVariable Long sectionId, @Valid @RequestBody SectionInput r, @AuthenticationPrincipal AuthPrincipal me) {
        exams.updateSection(sectionId, r, me);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sections/{sectionId}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long sectionId, @AuthenticationPrincipal AuthPrincipal me) {
        exams.deleteSection(sectionId, me);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/sections/{sectionId}/bands")
    public ResponseEntity<Void> sectionBands(@PathVariable Long sectionId, @RequestBody BandsInput r, @AuthenticationPrincipal AuthPrincipal me) {
        exams.setSectionBands(sectionId, r.bands() == null ? List.of() : r.bands(), me);
        return ResponseEntity.noContent().build();
    }

    // ---------- savollar ----------

    @PostMapping("/sections/{sectionId}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> addQuestion(@PathVariable Long sectionId, @Valid @RequestBody QuestionInput r, @AuthenticationPrincipal AuthPrincipal me) {
        return Map.of("id", exams.addQuestion(sectionId, r, me));
    }

    @PutMapping("/questions/{questionId}")
    public ResponseEntity<Void> updateQuestion(@PathVariable Long questionId, @Valid @RequestBody QuestionInput r, @AuthenticationPrincipal AuthPrincipal me) {
        exams.updateQuestion(questionId, r, me);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId, @AuthenticationPrincipal AuthPrincipal me) {
        exams.deleteQuestion(questionId, me);
        return ResponseEntity.noContent().build();
    }
}
