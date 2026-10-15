package uz.easystudy.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Cookie cookie, Demo demo, Media media, Ai ai) {

    public record Jwt(
            @NotBlank @Size(min = 32, message = "JWT secret kamida 32 belgidan iborat bo'lishi kerak") String secret,
            @Min(1) int accessTtlMinutes,
            @Min(1) int refreshTtlDays) {}

    public record Cors(List<String> origins) {}

    public record Cookie(boolean secure) {}

    public record Demo(String adminEmail, String adminPassword) {}

    /**
     * Media saqlash. provider = local (VPS diski, Spring orqali streaming) yoki s3 (MinIO, Backblaze B2, Cloudflare R2 ...).
     * publicUrl: talabaga beriladigan havolalar uchun bazaviy manzil (local rejimda API manzili).
     */
    public record Media(String provider, String dir, String publicUrl, long maxVideoMb, long maxAudioMb, long maxImageMb,
                        int urlTtlMinutes, S3 s3) {}

    public record S3(String endpoint, String publicEndpoint, String bucket, String accessKey, String secretKey, String region) {}

    /**
     * AI tekshiruv. provider = none (faqat o'qituvchi), claude (Anthropic API), fake (lokal sinov: deterministik baho).
     * transcription = none | openai (Whisper): Speaking audio -> matn; none bo'lsa Speaking o'qituvchiga qoladi.
     */
    public record Ai(String provider, String apiKey, String model, Transcription transcription) {}

    public record Transcription(String provider, String apiKey, String model) {}
}
