package uz.easystudy.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.ExamDtos.ExamDetail;
import uz.easystudy.dto.ExamDtos.ExamSummary;
import uz.easystudy.service.ExamService;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService exams;

    @GetMapping
    public List<ExamSummary> list() {
        return exams.listPublished();
    }

    @GetMapping("/{id}")
    public ExamDetail get(@PathVariable Long id) {
        return exams.getPublished(id);
    }
}
