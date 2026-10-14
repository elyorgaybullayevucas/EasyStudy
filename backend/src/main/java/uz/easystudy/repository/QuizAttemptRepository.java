package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.easystudy.domain.QuizAttempt;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    /** [quizId, maxScore, attempts] */
    @Query("select a.quizId, max(a.score), count(a) from QuizAttempt a where a.userId = :userId and a.quizId in :quizIds group by a.quizId")
    List<Object[]> bestByQuiz(Long userId, List<Long> quizIds);

    @Query("select count(distinct a.quizId) from QuizAttempt a where a.userId = :userId and a.passed = true")
    long countPassedQuizzes(Long userId);
}
