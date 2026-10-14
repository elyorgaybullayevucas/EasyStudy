package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.AuditLog;
import uz.easystudy.repository.AuditLogRepository;

@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditLogRepository repo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String action, String target, String ip) {
        AuditLog a = new AuditLog();
        a.setUserId(userId);
        a.setAction(action);
        a.setTarget(target);
        a.setIp(ip);
        repo.save(a);
    }
}
