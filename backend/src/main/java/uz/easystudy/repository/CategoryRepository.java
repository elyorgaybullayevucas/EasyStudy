package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.easystudy.domain.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    boolean existsByNameIgnoreCase(String name);
    boolean existsBySlug(String slug);
    List<Category> findAllByOrderByPositionAscNameAsc();

    /** [categoryId, publishedCourseCount] */
    @Query("select c.category.id, count(c) from Course c where c.category is not null and (:publishedOnly = false or c.published = true) group by c.category.id")
    List<Object[]> courseCounts(boolean publishedOnly);

    @Query("select e.category.id, count(e) from Exam e where e.category is not null and (:publishedOnly = false or e.published = true) group by e.category.id")
    List<Object[]> examCounts(boolean publishedOnly);
}
