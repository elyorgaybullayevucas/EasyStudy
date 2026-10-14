package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.Certificate;
import uz.easystudy.domain.Course;
import uz.easystudy.domain.Lesson;
import uz.easystudy.dto.LearningDtos.CertificateOut;
import uz.easystudy.repository.CertificateRepository;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificates;

    @Transactional(readOnly = true)
    public CertificateOut verify(String code) {
        Certificate c = certificates.findByCode(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> AppException.notFound("Sertifikat topilmadi"));
        return toOut(c);
    }

    @Transactional(readOnly = true)
    public List<CertificateOut> mine(Long userId) {
        return certificates.findByUserIdOrderByIssuedAtDesc(userId).stream().map(this::toOut).toList();
    }

    private CertificateOut toOut(Certificate c) {
        Course course = c.getCourse();
        long minutes = course.getLessons().stream().mapToLong(Lesson::getDurationMinutes).sum();
        return new CertificateOut(c.getCode(), c.getIssuedAt(), c.getUser().getFullName(), course.getTitle(), course.getSlug(),
                course.getInstructor() == null ? null : course.getInstructor().getFullName(), minutes);
    }
}
