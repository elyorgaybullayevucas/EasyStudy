package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.easystudy.domain.Quiz;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCourseIdOrderByIdAsc(Long courseId);

    /** [quizId, questionCount] */
    @Query("select q.quiz.id, count(q) from QuizQuestion q where q.quiz.course.id = :courseId group by q.quiz.id")
    List<Object[]> questionCounts(Long courseId);
}
