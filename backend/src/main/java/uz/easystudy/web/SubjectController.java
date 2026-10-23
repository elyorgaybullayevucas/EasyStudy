package uz.easystudy.web;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.SubjectDtos.PlacementDto;
import uz.easystudy.dto.SubjectDtos.SubjectDto;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.SubjectService;

import java.util.List;

/** Onlayn maktab: fanlar va bosqichlar. */
@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjects;

    @GetMapping
    public List<SubjectDto> list(@AuthenticationPrincipal AuthPrincipal me) {
        return subjects.list(me);
    }

    @GetMapping("/{slug}")
    public SubjectDto get(@PathVariable String slug, @AuthenticationPrincipal AuthPrincipal me) {
        return subjects.get(slug, me);
    }

    @GetMapping("/my-placements")
    public List<PlacementDto> myPlacements(@AuthenticationPrincipal AuthPrincipal me) {
        return subjects.myPlacements(me.id());
    }
}
