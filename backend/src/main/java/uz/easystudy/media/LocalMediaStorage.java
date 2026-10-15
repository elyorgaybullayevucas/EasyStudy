package uz.easystudy.media;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

/**
 * Fayllar VPS diskida (Docker volume). Havola: /api/media/{key}?exp=...&sig=HMAC(key|exp).
 * Imzo serverdagi secret bilan tekshiriladi, shuning uchun kalitni bilgan odam ham muddatsiz havola yasay olmaydi.
 */
public class LocalMediaStorage implements MediaStorage {

    private final Path root;
    private final String publicUrl;
    private final byte[] secret;

    public LocalMediaStorage(Path root, String publicUrl, String secret) throws IOException {
        this.root = root.toAbsolutePath().normalize();
        this.publicUrl = publicUrl.replaceAll("/+$", "");
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        Files.createDirectories(this.root);
    }

    private Path resolve(String key) {
        Path p = root.resolve(key).normalize();
        if (!p.startsWith(root)) throw new IllegalArgumentException("Noto'g'ri kalit");
        return p;
    }

    @Override
    public void put(String key, InputStream in, long size, String contentType) throws IOException {
        Path p = resolve(key);
        Files.createDirectories(p.getParent());
        Files.copy(in, p, StandardCopyOption.REPLACE_EXISTING);
    }

    @Override
    public void delete(String key) throws IOException {
        Files.deleteIfExists(resolve(key));
    }

    @Override
    public String url(String key, Duration ttl) {
        long exp = Instant.now().plus(ttl).getEpochSecond();
        return publicUrl + "/api/media/" + key + "?exp=" + exp + "&sig=" + sign(key, exp);
    }

    @Override
    public Resource resource(String key) {
        Path p = resolve(key);
        return Files.isRegularFile(p) ? new FileSystemResource(p) : null;
    }

    public boolean verify(String key, long exp, String sig) {
        if (sig == null || Instant.now().getEpochSecond() > exp) return false;
        return MessageDigest.isEqual(sign(key, exp).getBytes(StandardCharsets.UTF_8), sig.getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String key, long exp) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] out = mac.doFinal((key + "|" + exp).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(out);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
