package uz.easystudy.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import uz.easystudy.domain.Role;
import uz.easystudy.domain.User;
import uz.easystudy.repository.UserRepository;

/**
 * APP_DEMO_ADMIN_PASSWORD berilgan bo'lsa va hali ADMIN yo'q bo'lsa, demo admin yaratadi.
 * Parol hash'i SQL migratsiyada emas, runtime'da Argon2id bilan hisoblanadi.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoDataInitializer implements ApplicationRunner {

    private final AppProperties props;
    private final UserRepository users;
    private final PasswordEncoder encoder;

    @Override
    public void run(ApplicationArguments args) {
        String pw = props.demo().adminPassword();
        if (pw == null || pw.isBlank()) return;
        if (users.existsByRole(Role.ADMIN)) return;

        User admin = new User();
        admin.setEmail(props.demo().adminEmail());
        admin.setFullName("Administrator");
        admin.setRole(Role.ADMIN);
        admin.setPasswordHash(encoder.encode(pw));
        users.save(admin);
        log.warn("Demo ADMIN yaratildi: {} (prod'da APP_DEMO_ADMIN_PASSWORD ni bo'sh qoldiring)", admin.getEmail());
    }
}
