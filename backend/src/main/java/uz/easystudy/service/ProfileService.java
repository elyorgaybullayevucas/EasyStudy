package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.AttemptStatus;
import uz.easystudy.domain.User;
import uz.easystudy.dto.AuthDtos.UserResponse;
import uz.easystudy.dto.LearningDtos.DashboardStats;
import uz.easystudy.repository.*;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final RefreshTokenRepository refreshTokens;
    private final EnrollmentRepository enrollments;
    private final LessonProgressRepository lessonProgress;
    private final QuizAttemptRepository quizAttempts;
    private final CertificateRepository certificates;
    private final AttemptRepository attempts;

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return AuthService.toUser(users.findById(userId).orElseThrow(() -> AppException.notFound("Foydalanuvchi topilmadi")));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, uz.easystudy.dto.LearningDtos.ProfileUpdate in) {
        User u = users.findById(userId).orElseThrow(() -> AppException.notFound("Foydalanuvchi topilmadi"));
        u.setFullName(in.fullName().trim());
        u.setHeadline(blank(in.headline()));
        u.setBio(blank(in.bio()));
        u.setAvatarUrl(blank(in.avatarUrl()));
        return AuthService.toUser(u);
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    @Transactional
    public void changePassword(Long userId, String current, String next) {
        User u = users.findById(userId).orElseThrow(() -> AppException.notFound("Foydalanuvchi topilmadi"));
        if (!encoder.matches(current, u.getPasswordHash())) throw AppException.badRequest("Joriy parol noto'g'ri");
        if (!next.matches("^(?=.*[A-Za-z])(?=.*\\d).+$")) throw AppException.badRequest("Parolda harf va raqam bo'lishi shart");
        u.setPasswordHash(encoder.encode(next));
        // Boshqa qurilmalardagi sessiyalarni yopamiz
        refreshTokens.revokeAllForUser(userId);
    }

    @Transactional(readOnly = true)
    public DashboardStats dashboard(Long userId) {
        long enrolled = enrollments.countByUserId(userId);
        long completed = enrollments.countByUserIdAndCompletedAtIsNotNull(userId);
        return new DashboardStats(enrolled, completed, enrolled - completed,
                certificates.countByUserId(userId), lessonProgress.countByUserId(userId),
                quizAttempts.countPassedQuizzes(userId),
                attempts.countByUserId(userId),
                attempts.countByUserIdAndStatusIn(userId, List.of(AttemptStatus.GRADED, AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED)));
    }

    /** Qo'lda baholanadigan savollar borligini aniqlash uchun yordamchi (kelajakda statistika). */
    public static boolean needsManual(uz.easystudy.domain.Exam e) {
        return e.getSections().stream().flatMap(s -> s.getQuestions().stream()).anyMatch(q -> q.getType().isManual());
    }
}
