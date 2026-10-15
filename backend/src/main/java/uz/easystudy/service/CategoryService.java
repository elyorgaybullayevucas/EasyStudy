package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.Category;
import uz.easystudy.domain.CategoryGroup;
import uz.easystudy.dto.CourseDtos.CategoryBrief;
import uz.easystudy.dto.CourseDtos.CategoryDto;
import uz.easystudy.dto.CourseDtos.CategoryInput;
import uz.easystudy.repository.CategoryRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categories;

    @Transactional(readOnly = true)
    public List<CategoryDto> list(boolean publishedOnly) {
        Map<Long, Long> courseCounts = new HashMap<>();
        for (Object[] r : categories.courseCounts(publishedOnly)) courseCounts.put((Long) r[0], ((Number) r[1]).longValue());
        Map<Long, Long> examCounts = new HashMap<>();
        for (Object[] r : categories.examCounts(publishedOnly)) examCounts.put((Long) r[0], ((Number) r[1]).longValue());
        return categories.findAllByOrderByPositionAscNameAsc().stream().map(c -> toDto(c,
                courseCounts.getOrDefault(c.getId(), 0L), examCounts.getOrDefault(c.getId(), 0L))).toList();
    }

    private static CategoryDto toDto(Category c, long courses, long exams) {
        return new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getIcon(), c.getGroup(), c.getPosition(), courses, exams);
    }

    public static CategoryBrief brief(Category c) {
        return c == null ? null : new CategoryBrief(c.getId(), c.getName(), c.getSlug(), c.getIcon(), c.getGroup());
    }

    @Transactional
    public CategoryDto create(CategoryInput in) {
        if (categories.existsByNameIgnoreCase(in.name())) throw AppException.conflict("Bunday yo'nalish mavjud");
        Category c = new Category();
        c.setName(in.name().trim());
        c.setSlug(SlugUtil.unique(in.name(), categories::existsBySlug));
        apply(c, in);
        categories.save(c);
        return toDto(c, 0, 0);
    }

    @Transactional
    public CategoryDto update(Long id, CategoryInput in) {
        Category c = categories.findById(id).orElseThrow(() -> AppException.notFound("Yo'nalish topilmadi"));
        if (!c.getName().equalsIgnoreCase(in.name())) {
            if (categories.existsByNameIgnoreCase(in.name())) throw AppException.conflict("Bunday yo'nalish mavjud");
            c.setName(in.name().trim());
            c.setSlug(SlugUtil.unique(in.name(), s -> !s.equals(c.getSlug()) && categories.existsBySlug(s)));
        }
        apply(c, in);
        return toDto(c, 0, 0);
    }

    private static void apply(Category c, CategoryInput in) {
        c.setDescription(in.description());
        c.setIcon(in.icon());
        c.setGroup(in.group() == null ? CategoryGroup.OTHER : in.group());
        if (in.position() != null) c.setPosition(in.position());
    }

    @Transactional
    public void delete(Long id) {
        if (!categories.existsById(id)) throw AppException.notFound("Yo'nalish topilmadi");
        categories.deleteById(id);
    }

    public Category require(Long id) {
        if (id == null) return null;
        return categories.findById(id).orElseThrow(() -> AppException.badRequest("Yo'nalish topilmadi"));
    }
}
