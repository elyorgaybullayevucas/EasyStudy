package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.easystudy.domain.AttemptSection;

import java.util.List;
import java.util.Optional;

public interface AttemptSectionRepository extends JpaRepository<AttemptSection, Long> {
    List<AttemptSection> findByAttemptId(Long attemptId);
    Optional<AttemptSection> findByAttemptIdAndSectionId(Long attemptId, Long sectionId);
}
