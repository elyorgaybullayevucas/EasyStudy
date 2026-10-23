package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.easystudy.domain.CourseModule;

public interface CourseModuleRepository extends JpaRepository<CourseModule, Long> {
}
