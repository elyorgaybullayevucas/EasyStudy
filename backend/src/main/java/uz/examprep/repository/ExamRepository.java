package uz.examprep.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.examprep.domain.Exam;

import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByPublishedTrueOrderByTitleAsc();
    Optional<Exam> findByIdAndPublishedTrue(Long id);
    boolean existsByCode(String code);
}
