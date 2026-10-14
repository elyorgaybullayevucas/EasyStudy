package uz.easystudy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.easystudy.domain.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
