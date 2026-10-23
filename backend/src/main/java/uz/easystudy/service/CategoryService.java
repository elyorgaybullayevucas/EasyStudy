package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.Category;
import uz.easystudy.domain.CategoryGroup;
import uz.easystudy.domain.Role;
import uz.easystudy.domain.User;
import uz.easystudy.dto.CourseDtos.CategoryBrief;
import uz.easystudy.dto.CourseDtos.CategoryDto;
import uz.easystudy.dto.CourseDtos.CategoryInput;
import uz.easystudy.dto.CourseDtos.InstructorBrief;
import uz.easystudy.repository.CategoryRepository;
import uz.easystudy.repository.ExamRepository;
import uz.easystudy.repository.UserRepository;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categories;
    private final ExamRepository exams;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<CategoryDto> list(boolean publishedOnly) {
        Map<Long, Long> courseCounts = new HashMap<>();
        for (Object[] r : categories.courseCounts(publishedOnly)) courseCounts.put((Long) r[0], ((Number) r[1]).longValue());
        Map<Long, Long> examCounts = new HashMap<>();
        for (Object[] r : categories.examCounts(publishedOnly)) examCounts.put((Long) r[0], ((Number) r[1]).longValue());
        return categories.findAllByOrderByPositionAscNameAsc().stream().map(c -> toDto(c,
                courseCounts.getOrDefault(c.getId(), 0L), examCounts.getOrDefault(c.getId(), 0L))).toList();
    }

    public static CategoryDto toDto(Category c, long courses, long examCount) {
        return new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getIcon(), c.getGroup(), c.getPosition(), courses, examCount,
                CourseService.examBrief(c.getPlacementExam()), certSlugs(c),
                c.getTeachers().stream().sorted(Comparator.comparing(User::getFullName)).map(CourseService::instructor).toList());
    }

    public static List<String> certSlugs(Category c) {
        if (c.getCertSlugs() == null || c.getCertSlugs().isBlank()) return List.of();
        return Arrays.stream(c.getCertSlugs().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public static CategoryBrief brief(Category c) {
        return c == null ? null : new CategoryBrief(c.getId(), c.getName(), c.getSlug(), c.getIcon(), c.getGroup());
    }

    // ---------------- o'qituvchi biriktirish ----------------

    /** Foydalanuvchi shu fanga mas'ul o'qituvchimi. */
    @Transactional(readOnly = true)
    public boolean isTeacherOf(Long userId, Long categoryId) {
        return categoryId != null && categories.teacherCategoryIds(userId).contains(categoryId);
    }

    @Transactional(readOnly = true)
    public List<Long> teacherCategoryIds(Long userId) {
        return categories.teacherCategoryIds(userId);
    }

    /** O'qituvchiga biriktirilgan fanlar; admin uchun barcha fanlar. */
    @Transactional(readOnly = true)
    public List<CategoryDto> mySubjects(Long userId, Role role) {
        List<Category> list = role == Role.ADMIN ? categories.findAllByOrderByPositionAscNameAsc() : categories.findByTeacher(userId);
        Map<Long, Long> courseCounts = new HashMap<>();
        for (Object[] r : categories.courseCounts(false)) courseCounts.put((Long) r[0], ((Number) r[1]).longValue());
        Map<Long, Long> examCounts = new HashMap<>();
        for (Object[] r : categories.examCounts(false)) examCounts.put((Long) r[0], ((Number) r[1]).longValue());
        return list.stream().map(c -> toDto(c, courseCounts.getOrDefault(c.getId(), 0L), examCounts.getOrDefault(c.getId(), 0L))).toList();
    }

    @Transactional
    public CategoryDto setTeachers(Long categoryId, List<Long> userIds) {
        Category c = categories.findById(categoryId).orElseThrow(() -> AppException.notFound("Yo'nalish topilmadi"));
        Set<User> set = new HashSet<>();
        for (Long id : userIds == null ? List.<Long>of() : userIds) {
            User u = users.findById(id).orElseThrow(() -> AppException.badRequest("Foydalanuvchi topilmadi: " + id));
            if (u.getRole() == Role.STUDENT) throw AppException.badRequest(u.getFullName() + " o'qituvchi emas: avval rolini TEACHER qiling");
            set.add(u);
        }
        c.setTeachers(set);
        return toDto(c, 0, 0);
    }

    // ---------------- CRUD ----------------

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

    private void apply(Category c, CategoryInput in) {
        c.setDescription(in.description());
        c.setIcon(in.icon());
        c.setGroup(in.group() == null ? CategoryGroup.OTHER : in.group());
        if (in.position() != null) c.setPosition(in.position());
        c.setPlacementExam(in.placementExamId() == null ? null : exams.findById(in.placementExamId()).orElseThrow(() -> AppException.badRequest("Imtihon topilmadi")));
        c.setCertSlugs(in.certSlugs() == null || in.certSlugs().isBlank() ? null : in.certSlugs().trim());
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
