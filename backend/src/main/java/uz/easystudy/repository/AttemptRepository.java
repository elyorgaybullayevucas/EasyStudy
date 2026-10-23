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
    List<Attempt> findByUserIdAndExamIdAndStatusInOrderByScaledScoreDescRawScoreDesc(Long userId, Long examId, List<AttemptStatus> statuses);
    /** Fan bo'yicha so'nggi urinishlar (o'qituvchi nazorati) */
    @Query("select a from Attempt a where a.exam.category.id = :categoryId and a.status <> uz.easystudy.domain.AttemptStatus.IN_PROGRESS order by a.submittedAt desc, a.id desc")
    List<Attempt> recentByCategory(Long categoryId, org.springframework.data.domain.Pageable pageable);
    long countByUserIdAndStatusIn(Long userId, List<AttemptStatus> statuses);

    /** Tekshirish navbati: o'qituvchi o'z imtihonlari, admin hammasi. */
    @Query("select a from Attempt a where a.status in :statuses and (:ownerId is null or a.exam.owner.id = :ownerId) order by a.submittedAt desc, a.id desc")
    List<Attempt> findForGrading(List<AttemptStatus> statuses, Long ownerId);

    /** [examId, attemptCount] */
    @Query("select a.exam.id, count(a) from Attempt a where a.exam.id in :ids group by a.exam.id")
    List<Object[]> attemptCounts(List<Long> ids);
}
