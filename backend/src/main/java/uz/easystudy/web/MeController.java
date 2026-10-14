package uz.easystudy.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.easystudy.dto.AuthDtos.UserResponse;
import uz.easystudy.dto.LearningDtos.*;
import uz.easystudy.security.AuthPrincipal;
import uz.easystudy.service.CertificateService;
import uz.easystudy.service.LearningService;
import uz.easystudy.service.ProfileService;

import java.util.List;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final ProfileService profile;
    private final LearningService learning;
    private final CertificateService certificates;

    @GetMapping
    public UserResponse me(@AuthenticationPrincipal AuthPrincipal me) {
        return profile.me(me.id());
    }

    @PatchMapping
    public UserResponse update(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody ProfileUpdate r) {
        return profile.updateProfile(me.id(), r);
    }

    @PostMapping("/password")
    public ResponseEntity<Void> password(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody PasswordChange r) {
        profile.changePassword(me.id(), r.currentPassword(), r.newPassword());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/courses")
    public List<MyCourse> courses(@AuthenticationPrincipal AuthPrincipal me) {
        return learning.myCourses(me.id());
    }

    @GetMapping("/dashboard")
    public DashboardStats dashboard(@AuthenticationPrincipal AuthPrincipal me) {
        return profile.dashboard(me.id());
    }

    @GetMapping("/certificates")
    public List<CertificateOut> certificates(@AuthenticationPrincipal AuthPrincipal me) {
        return certificates.mine(me.id());
    }
}
