package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.easystudy.domain.Exam;

import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByPublishedTrueOrderByFeaturedDescTitleAsc();
    List<Exam> findByPublishedTrueAndFeaturedTrueOrderByTitleAsc();
    List<Exam> findAllByOrderByCreatedAtDesc();
    List<Exam> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Optional<Exam> findByIdAndPublishedTrue(Long id);
    boolean existsByCode(String code);
    long countByPublishedTrue();

    @Query("select e from Exam e where e.published = true and (:categorySlug is null or e.category.slug = :categorySlug) order by e.featured desc, e.title asc")
    List<Exam> findPublishedByCategory(String categorySlug);
}
