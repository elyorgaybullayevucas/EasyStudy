package uz.examprep.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.examprep.domain.Section;

public interface SectionRepository extends JpaRepository<Section, Long> {
}
