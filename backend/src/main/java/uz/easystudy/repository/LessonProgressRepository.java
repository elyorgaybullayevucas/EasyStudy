package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.easystudy.domain.LessonProgress;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    Optional<LessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);
    long countByUserId(Long userId);

    @Query("select p.lessonId from LessonProgress p, Lesson l where l.id = p.lessonId and p.userId = :userId and l.course.id = :courseId")
    List<Long> completedLessonIds(Long userId, Long courseId);
}
