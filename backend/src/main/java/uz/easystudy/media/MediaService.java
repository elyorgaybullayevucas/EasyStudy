package uz.easystudy.media;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import uz.easystudy.config.AppProperties;
import uz.easystudy.service.AppException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
public class MediaService {

    public enum Kind { VIDEO, AUDIO, IMAGE }

    private static final Map<String, String> VIDEO_TYPES = Map.of("video/mp4", "mp4", "video/webm", "webm", "video/quicktime", "mov");
    private static final Map<String, String> AUDIO_TYPES = Map.of("audio/mpeg", "mp3", "audio/mp4", "m4a", "audio/ogg", "ogg",
            "audio/wav", "wav", "audio/x-wav", "wav", "audio/webm", "webm", "video/webm", "webm");
    private static final Map<String, String> IMAGE_TYPES = Map.of("image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");
    private static final SecureRandom RNG = new SecureRandom();

    private final AppProperties.Media cfg;
    private final MediaStorage storage;
    private final LocalMediaStorage local; // null bo'lsa S3 rejimi

    public MediaService(AppProperties props) throws IOException {
        this.cfg = props.media();
        if ("s3".equalsIgnoreCase(cfg.provider())) {
            this.storage = new S3MediaStorage(cfg.s3());
            this.local = null;
            log.info("Media: S3 rejimi, bucket={}", cfg.s3().bucket());
        } else {
            this.local = new LocalMediaStorage(Path.of(cfg.dir()), cfg.publicUrl(), props.jwt().secret());
            this.storage = local;
            log.info("Media: lokal rejim, dir={}", cfg.dir());
        }
    }

    /** Yuklash: tur va hajm tekshiriladi, kalit tasodifiy (taxmin qilib bo'lmaydi). */
    public String upload(MultipartFile file, Kind kind) {
        String ct = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT).split(";")[0].trim();
        Map<String, String> allowed = switch (kind) { case VIDEO -> VIDEO_TYPES; case AUDIO -> AUDIO_TYPES; case IMAGE -> IMAGE_TYPES; };
        String ext = allowed.get(ct);
        if (ext == null) throw AppException.badRequest("Fayl turi qo'llab-quvvatlanmaydi: " + ct + ". Ruxsat: " + String.join(", ", allowed.keySet()));
        long maxMb = switch (kind) { case VIDEO -> cfg.maxVideoMb(); case AUDIO -> cfg.maxAudioMb(); case IMAGE -> cfg.maxImageMb(); };
        if (file.getSize() > maxMb * 1024 * 1024) throw AppException.badRequest("Fayl juda katta. Maksimum " + maxMb + " MB");

        byte[] b = new byte[16];
        RNG.nextBytes(b);
        String key = kind.name().toLowerCase(Locale.ROOT) + "/" + HexFormat.of().formatHex(b) + "." + ext;
        try (InputStream in = file.getInputStream()) {
            storage.put(key, in, file.getSize(), ct);
        } catch (IOException e) {
            throw new AppException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Faylni saqlab bo'lmadi");
        }
        return key;
    }

    /** Talaba uchun vaqtli havola; key bo'sh bo'lsa null. */
    public String url(String key) {
        if (key == null || key.isBlank()) return null;
        return storage.url(key, Duration.ofMinutes(cfg.urlTtlMinutes()));
    }

    public void delete(String key) {
        if (key == null || key.isBlank()) return;
        try {
            storage.delete(key);
        } catch (IOException e) {
            log.warn("Media o'chirilmadi: {}", key);
        }
    }

    // ---- lokal rejim: imzolangan havolani tekshirib fayl berish ----

    public Resource open(String key, long exp, String sig) {
        if (local == null) throw AppException.notFound("Media topilmadi");
        if (!local.verify(key, exp, sig)) throw AppException.forbidden("Havola muddati tugagan yoki noto'g'ri");
        Resource r = local.resource(key);
        if (r == null) throw AppException.notFound("Media topilmadi");
        return r;
    }

    public static String contentTypeFor(String key) {
        String ext = key.substring(key.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        return switch (ext) {
            case "mp4" -> "video/mp4"; case "webm" -> "video/webm"; case "mov" -> "video/quicktime";
            case "mp3" -> "audio/mpeg"; case "m4a" -> "audio/mp4"; case "ogg" -> "audio/ogg"; case "wav" -> "audio/wav";
            case "jpg" -> "image/jpeg"; case "png" -> "image/png"; case "webp" -> "image/webp";
            default -> "application/octet-stream";
        };
    }
}
