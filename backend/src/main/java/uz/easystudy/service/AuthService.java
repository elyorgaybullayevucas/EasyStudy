package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.config.AppProperties;
import uz.easystudy.domain.RefreshToken;
import uz.easystudy.domain.Role;
import uz.easystudy.domain.User;
import uz.easystudy.dto.AuthDtos.*;
import uz.easystudy.repository.RefreshTokenRepository;
import uz.easystudy.repository.UserRepository;
import uz.easystudy.security.JwtService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom RNG = new SecureRandom();

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AppProperties props;
    private final AuditService audit;

    /** Login natijasi: access token + xom refresh token (cookie'ga qo'yiladi). */
    public record Session(TokenResponse tokens, String rawRefreshToken, long refreshTtlSeconds) {}

    @Transactional
    public Session register(RegisterRequest r, String ip) {
        if (users.existsByEmailIgnoreCase(r.email())) {
            throw AppException.conflict("Bu email allaqachon ro'yxatdan o'tgan");
        }
        User u = new User();
        u.setEmail(r.email().toLowerCase());
        u.setFullName(r.fullName().trim());
        u.setRole(Role.STUDENT);
        u.setPasswordHash(encoder.encode(r.password()));
        users.save(u);
        audit.log(u.getId(), "REGISTER", u.getEmail(), ip);
        return issue(u);
    }

    @Transactional
    public Session login(LoginRequest r, String ip) {
        User u = users.findByEmailIgnoreCase(r.email())
                .orElseThrow(() -> new BadCredentialsException("bad"));
        // enumeration oldini olish: xato xabari bir xil
        if (!u.isEnabled() || !encoder.matches(r.password(), u.getPasswordHash())) {
            audit.log(u.getId(), "LOGIN_FAILED", u.getEmail(), ip);
            throw new BadCredentialsException("bad");
        }
        audit.log(u.getId(), "LOGIN", u.getEmail(), ip);
        return issue(u);
    }

    /** Refresh token rotation: eski token bekor qilinadi, yangisi beriladi. Qayta ishlatilsa barchasi bekor. */
    @Transactional
    public Session refresh(String rawToken, String ip) {
        if (rawToken == null || rawToken.isBlank()) throw AppException.unauthorized("Refresh token yo'q");
        RefreshToken t = refreshTokens.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> AppException.unauthorized("Refresh token noto'g'ri"));
        User u = t.getUser();
        if (t.isRevoked()) {
            // Token reuse aniqlandi -> foydalanuvchining barcha sessiyalarini yopamiz
            refreshTokens.revokeAllForUser(u.getId());
            audit.log(u.getId(), "REFRESH_REUSE_DETECTED", null, ip);
            throw AppException.unauthorized("Sessiya bekor qilindi");
        }
        if (t.getExpiresAt().isBefore(Instant.now())) throw AppException.unauthorized("Refresh token muddati tugagan");
        if (!u.isEnabled()) throw AppException.unauthorized("Foydalanuvchi bloklangan");
        t.setRevoked(true);
        return issue(u);
    }

    @Transactional
    public void logout(String rawToken, Long userId, String ip) {
        if (rawToken != null && !rawToken.isBlank()) {
            refreshTokens.findByTokenHash(sha256(rawToken)).ifPresent(t -> t.setRevoked(true));
        }
        if (userId != null) audit.log(userId, "LOGOUT", null, ip);
    }

    private Session issue(User u) {
        byte[] bytes = new byte[32];
        RNG.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        long ttl = Duration.ofDays(props.jwt().refreshTtlDays()).toSeconds();
        RefreshToken t = new RefreshToken();
        t.setUser(u);
        t.setTokenHash(sha256(raw));
        t.setExpiresAt(Instant.now().plusSeconds(ttl));
        refreshTokens.save(t);

        TokenResponse tokens = new TokenResponse(jwt.createAccessToken(u), jwt.accessTtlSeconds(), toUser(u));
        return new Session(tokens, raw, ttl);
    }

    public static UserResponse toUser(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getFullName(), u.getRole().name());
    }

    private static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
