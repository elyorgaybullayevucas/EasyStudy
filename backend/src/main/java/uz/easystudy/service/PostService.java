package uz.easystudy.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.Post;
import uz.easystudy.domain.Role;
import uz.easystudy.domain.User;
import uz.easystudy.dto.PageDto;
import uz.easystudy.dto.PostDtos.*;
import uz.easystudy.repository.CourseRepository;
import uz.easystudy.repository.PostRepository;
import uz.easystudy.repository.UserRepository;
import uz.easystudy.security.AuthPrincipal;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository posts;
    private final UserRepository users;
    private final CourseRepository courses;
    private final CourseService courseService;
    private final CategoryService categoryService;

    public static AuthorBrief author(User u) {
        return u == null ? null : new AuthorBrief(u.getId(), u.getFullName(), u.getHeadline(), u.getAvatarUrl());
    }

    private PostListItem toItem(Post p) {
        return new PostListItem(p.getId(), p.getTitle(), p.getSlug(), p.getExcerpt(), p.getCoverUrl(), p.isPublished(),
                CategoryService.brief(p.getCategory()), author(p.getAuthor()), p.getViews(), p.getCreatedAt());
    }

    private PostDetail toDetail(Post p) {
        return new PostDetail(p.getId(), p.getTitle(), p.getSlug(), p.getExcerpt(), p.getContent(), p.getCoverUrl(),
                p.isPublished(), CategoryService.brief(p.getCategory()), author(p.getAuthor()), p.getViews(),
                p.getCreatedAt(), p.getUpdatedAt());
    }

    private boolean canManage(AuthPrincipal me, Post p) {
        return me != null && (me.role() == Role.ADMIN || p.getAuthor().getId().equals(me.id()));
    }

    // ---------------- ochiq ----------------

    @Transactional(readOnly = true)
    public PageDto<PostListItem> list(String search, String categorySlug, Long authorId, boolean publishedOnly,
                                      Long restrictToAuthor, int page, int size) {
        Specification<Post> spec = (root, q, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (publishedOnly) ps.add(cb.isTrue(root.<Boolean>get("published")));
            if (authorId != null) ps.add(cb.equal(root.get("author").get("id"), authorId));
            if (restrictToAuthor != null) ps.add(cb.equal(root.get("author").get("id"), restrictToAuthor));
            if (search != null && !search.isBlank()) {
                String p = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                ps.add(cb.or(cb.like(cb.lower(root.<String>get("title")), p), cb.like(cb.lower(root.<String>get("excerpt")), p)));
            }
            if (categorySlug != null && !categorySlug.isBlank()) ps.add(cb.equal(root.get("category").get("slug"), categorySlug));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        Page<Post> p = posts.findAll(spec, PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
        return new PageDto<>(p.getContent().stream().map(this::toItem).toList(), p.getTotalElements(), page, size);
    }

    @Transactional
    public PostDetail getPublic(String slug, AuthPrincipal me) {
        Post p = posts.findBySlug(slug).orElseThrow(() -> AppException.notFound("Maqola topilmadi"));
        if (!p.isPublished() && !canManage(me, p)) throw AppException.notFound("Maqola topilmadi");
        if (p.isPublished()) p.setViews(p.getViews() + 1);
        return toDetail(p);
    }

    @Transactional(readOnly = true)
    public TeacherProfile teacher(Long id) {
        User u = users.findById(id).orElseThrow(() -> AppException.notFound("O'qituvchi topilmadi"));
        if (u.getRole() == Role.STUDENT) throw AppException.notFound("O'qituvchi topilmadi");
        var page = courseService.list(null, null, null, null, true, u.getId(), 1, 50);
        long students = page.items().stream().mapToLong(c -> c.studentCount()).sum();
        List<PostListItem> myPosts = posts.findByAuthorIdAndPublishedTrueOrderByCreatedAtDesc(u.getId()).stream().map(this::toItem).toList();
        return new TeacherProfile(u.getId(), u.getFullName(), u.getHeadline(), u.getBio(), u.getAvatarUrl(), u.getCreatedAt(),
                students, page.items(), myPosts);
    }

    // ---------------- admin / teacher ----------------

    @Transactional(readOnly = true)
    public PageDto<PostListItem> adminList(String search, AuthPrincipal me, int page, int size) {
        return list(search, null, null, false, me.role() == Role.ADMIN ? null : me.id(), page, size);
    }

    @Transactional(readOnly = true)
    public PostDetail adminGet(Long id, AuthPrincipal me) {
        return toDetail(managed(id, me));
    }

    private Post managed(Long id, AuthPrincipal me) {
        Post p = posts.findById(id).orElseThrow(() -> AppException.notFound("Maqola topilmadi"));
        if (!canManage(me, p)) throw AppException.forbidden("Bu maqolani boshqarishga ruxsat yo'q");
        return p;
    }

    @Transactional
    public PostDetail create(PostInput in, AuthPrincipal me) {
        Post p = new Post();
        p.setAuthor(users.getReferenceById(me.id()));
        p.setSlug(SlugUtil.unique(in.title(), posts::existsBySlug));
        apply(p, in);
        posts.save(p);
        return toDetail(p);
    }

    @Transactional
    public PostDetail update(Long id, PostInput in, AuthPrincipal me) {
        Post p = managed(id, me);
        if (!p.getTitle().equals(in.title())) {
            p.setSlug(SlugUtil.unique(in.title(), s -> !s.equals(p.getSlug()) && posts.existsBySlug(s)));
        }
        apply(p, in);
        p.setUpdatedAt(Instant.now());
        return toDetail(p);
    }

    @Transactional
    public void delete(Long id, AuthPrincipal me) {
        posts.delete(managed(id, me));
    }

    private void apply(Post p, PostInput in) {
        p.setTitle(in.title().trim());
        p.setExcerpt(in.excerpt().trim());
        p.setContent(in.content() == null ? "" : in.content());
        p.setCoverUrl(in.coverUrl() == null || in.coverUrl().isBlank() ? null : in.coverUrl().trim());
        p.setCategory(categoryService.require(in.categoryId()));
        p.setPublished(in.published());
    }
}
