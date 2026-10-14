package uz.easystudy.web;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.PageDto;
import uz.easystudy.dto.PostDtos.PostDetail;
import uz.easystudy.dto.PostDtos.PostListItem;
import uz.easystudy.dto.PostDtos.TeacherProfile;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.PostService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostController {

    private final PostService posts;

    @GetMapping("/posts")
    public PageDto<PostListItem> list(@RequestParam(required = false) String search,
                                      @RequestParam(required = false) String category,
                                      @RequestParam(required = false) Long author,
                                      @RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "12") int size) {
        return posts.list(search, category, author, true, null, page, size);
    }

    @GetMapping("/posts/{slug}")
    public PostDetail get(@PathVariable String slug, @AuthenticationPrincipal AuthPrincipal me) {
        return posts.getPublic(slug, me);
    }

    @GetMapping("/teachers/{id}")
    public TeacherProfile teacher(@PathVariable Long id) {
        return posts.teacher(id);
    }
}
