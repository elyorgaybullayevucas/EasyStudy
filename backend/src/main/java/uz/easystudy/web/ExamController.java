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
    public List<ExamSummary> list(@RequestParam(required = false) String category,
                                  @RequestParam(required = false) Boolean featured) {
        return exams.listPublished(category, featured);
    }

    @GetMapping("/{id}")
    public ExamDetail get(@PathVariable Long id) {
        return exams.getPublished(id);
    }
}
