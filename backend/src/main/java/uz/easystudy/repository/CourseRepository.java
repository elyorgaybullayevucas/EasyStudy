package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import uz.easystudy.domain.Course;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {
    Optional<Course> findBySlug(String slug);
    boolean existsBySlug(String slug);
    long countByPublishedTrue();

    /** [courseId, lessonCount, totalMinutes] */
    @Query("select l.course.id, count(l), coalesce(sum(l.durationMinutes), 0) from Lesson l where l.course.id in :ids group by l.course.id")
    List<Object[]> lessonStats(List<Long> ids);

    /** [courseId, studentCount] */
    @Query("select e.course.id, count(e) from Enrollment e where e.course.id in :ids group by e.course.id")
    List<Object[]> studentCounts(List<Long> ids);
}
