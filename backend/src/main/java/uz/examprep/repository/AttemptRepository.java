package uz.examprep.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.examprep.domain.Attempt;
import uz.examprep.domain.AttemptStatus;

import java.util.List;
import java.util.Optional;

public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    List<Attempt> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<Attempt> findByIdAndUserId(Long id, Long userId);
    Optional<Attempt> findFirstByUserIdAndExamIdAndStatus(Long userId, Long examId, AttemptStatus status);
}
