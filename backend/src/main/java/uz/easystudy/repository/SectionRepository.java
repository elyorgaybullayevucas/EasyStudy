package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.easystudy.domain.Section;

public interface SectionRepository extends JpaRepository<Section, Long> {
}
