package uz.easystudy.media;

import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;

/** Saqlash backendi: lokal disk yoki S3-mos object storage. Kalit (key) bazada saqlanadi, fayl joyi emas. */
public interface MediaStorage {

    void put(String key, InputStream in, long size, String contentType) throws IOException;

    void delete(String key) throws IOException;

    /** Talaba uchun vaqtli havola. Lokal rejimda imzolangan API havolasi, S3 da presigned URL. */
    String url(String key, Duration ttl);

    /** Lokal rejimda streaming uchun; S3 da null. */
    default Resource resource(String key) {
        return null;
    }
}
