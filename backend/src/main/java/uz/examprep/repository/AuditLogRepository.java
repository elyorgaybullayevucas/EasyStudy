package uz.examprep.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.examprep.domain.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
