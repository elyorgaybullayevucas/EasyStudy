package uz.easystudy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import uz.easystudy.dto.CourseDtos.CategoryBrief;
import uz.easystudy.dto.CourseDtos.CourseListItem;

import java.time.Instant;
import java.util.List;

public final class PostDtos {
    private PostDtos() {}

    public record AuthorBrief(Long id, String fullName, String headline, String avatarUrl) {}

    public record PostListItem(Long id, String title, String slug, String excerpt, String coverUrl, boolean published,
                               CategoryBrief category, AuthorBrief author, long views, Instant createdAt) {}

    public record PostDetail(Long id, String title, String slug, String excerpt, String content, String coverUrl,
                             boolean published, CategoryBrief category, AuthorBrief author, long views,
                             Instant createdAt, Instant updatedAt) {}

    public record PostInput(
            @NotBlank @Size(min = 3, max = 200) String title,
            @NotBlank @Size(min = 10, max = 400) String excerpt,
            String content,
            @Size(max = 500) String coverUrl,
            Long categoryId,
            boolean published) {}

    /** O'qituvchining ochiq sahifasi. */
    public record TeacherProfile(Long id, String fullName, String headline, String bio, String avatarUrl, Instant createdAt,
                                 long studentCount, List<CourseListItem> courses, List<PostListItem> posts) {}
}
