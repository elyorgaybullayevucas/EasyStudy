package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.easystudy.domain.Attempt;
import uz.easystudy.domain.AttemptStatus;

import java.util.List;
import java.util.Optional;

public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    List<Attempt> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<Attempt> findByIdAndUserId(Long id, Long userId);
    Optional<Attempt> findFirstByUserIdAndExamIdAndStatus(Long userId, Long examId, AttemptStatus status);
    long countByUserId(Long userId);
    long countByUserIdAndStatusIn(Long userId, List<AttemptStatus> statuses);

    /** [examId, attemptCount] */
    @Query("select a.exam.id, count(a) from Attempt a where a.exam.id in :ids group by a.exam.id")
    List<Object[]> attemptCounts(List<Long> ids);
}
