package uz.easystudy.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.easystudy.dto.LearningDtos.CertificateOut;
import uz.easystudy.service.CertificateService;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificates;

    /** Ochiq tekshirish: ish beruvchi kod orqali haqiqiyligini ko'radi. */
    @GetMapping("/{code}")
    public CertificateOut verify(@PathVariable String code) {
        return certificates.verify(code);
    }
}
