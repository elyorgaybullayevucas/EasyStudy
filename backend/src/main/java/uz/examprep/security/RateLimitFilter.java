package uz.examprep.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * IP bo'yicha brute-force himoyasi: login/register/refresh uchun daqiqasiga 10 ta urinish.
 * Bir nechta instansiya bo'lsa Redis-backed Bucket4j ga o'tkaziladi.
 * SecurityConfig ichida qo'lda yaratiladi (bean emas).
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String p = request.getRequestURI();
        return !(request.getMethod().equals("POST") && p.startsWith("/api/auth/"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String ip = clientIp(req);
        Bucket bucket = buckets.computeIfAbsent(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build())
                .build());
        if (bucket.tryConsume(1)) {
            chain.doFilter(req, res);
        } else {
            res.setStatus(429);
            res.setContentType("application/problem+json");
            res.getWriter().write("{\"status\":429,\"detail\":\"Juda ko'p urinish. Bir daqiqadan so'ng qayta urinib ko'ring.\"}");
        }
    }

    private static String clientIp(HttpServletRequest req) {
        // Reverse proxy ortida bo'lsa X-Forwarded-For dan faqat ishonchli proxy orqali foydalaning
        String xff = req.getHeader("X-Forwarded-For");
        return xff != null ? xff.split(",")[0].trim() : req.getRemoteAddr();
    }
}
