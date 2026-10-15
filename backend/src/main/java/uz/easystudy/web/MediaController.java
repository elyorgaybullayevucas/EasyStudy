package uz.easystudy.web;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.easystudy.media.MediaService;

import java.time.Duration;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MediaController {

    private final MediaService media;

    /** O'qituvchi/admin yuklaydi: kind = VIDEO | AUDIO | IMAGE. Javob: saqlash kaliti. */
    @PostMapping(value = "/api/admin/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file, @RequestParam("kind") MediaService.Kind kind) {
        String key = media.upload(file, kind);
        return Map.of("key", key, "size", file.getSize(), "contentType", String.valueOf(file.getContentType()), "previewUrl", media.url(key));
    }

    /**
     * Lokal rejimda imzolangan havola orqali streaming. Spring MVC Range so'rovlarini (206) o'zi qo'llab-quvvatlaydi,
     * shuning uchun video pleer istalgan joyga o'tib ko'ra oladi.
     */
    @GetMapping("/api/media/{kind}/{file}")
    public ResponseEntity<Resource> stream(@PathVariable String kind, @PathVariable String file,
                                           @RequestParam long exp, @RequestParam String sig) {
        String key = kind + "/" + file;
        Resource r = media.open(key, exp, sig);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaService.contentTypeFor(key))
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePrivate())
                .body(r);
    }
}
