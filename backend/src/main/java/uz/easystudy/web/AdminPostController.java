package uz.easystudy.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.PageDto;
import uz.easystudy.dto.PostDtos.PostDetail;
import uz.easystudy.dto.PostDtos.PostInput;
import uz.easystudy.dto.PostDtos.PostListItem;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.PostService;

@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class AdminPostController {

    private final PostService posts;

    @GetMapping
    public PageDto<PostListItem> list(@RequestParam(required = false) String search,
                                      @RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "50") int size,
                                      @AuthenticationPrincipal AuthPrincipal me) {
        return posts.adminList(search, me, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostDetail create(@Valid @RequestBody PostInput r, @AuthenticationPrincipal AuthPrincipal me) {
        return posts.create(r, me);
    }

    @GetMapping("/{id}")
    public PostDetail get(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal me) {
        return posts.adminGet(id, me);
    }

    @PutMapping("/{id}")
    public PostDetail update(@PathVariable Long id, @Valid @RequestBody PostInput r, @AuthenticationPrincipal AuthPrincipal me) {
        return posts.update(id, r, me);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AuthPrincipal me) {
        posts.delete(id, me);
        return ResponseEntity.noContent().build();
    }
}
