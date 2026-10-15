package uz.easystudy.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

/** OpenAI Whisper (audio/transcriptions) orqali transkripsiya; oddiy HTTP multipart, SDK'siz. */
@Slf4j
public class OpenAiWhisperTranscriber implements Transcriber {

    private final String apiKey;
    private final String model;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
    private final ObjectMapper mapper = new ObjectMapper();

    public OpenAiWhisperTranscriber(String apiKey, String model) {
        this.apiKey = apiKey;
        this.model = model == null || model.isBlank() ? "whisper-1" : model;
    }

    @Override
    public boolean available() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String transcribe(Resource audio, String filename, String language) {
        if (!available()) return null;
        try (InputStream in = audio.getInputStream()) {
            byte[] bytes = in.readAllBytes();
            String boundary = "----es" + UUID.randomUUID().toString().replace("-", "");
            ByteArrayOutputStream body = new ByteArrayOutputStream();
            body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\n" + model + "\r\n").getBytes(StandardCharsets.UTF_8));
            if (language != null) body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"language\"\r\n\r\n" + language + "\r\n").getBytes(StandardCharsets.UTF_8));
            body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\nContent-Type: application/octet-stream\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            body.write(bytes);
            body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/audio/transcriptions"))
                    .timeout(Duration.ofMinutes(3))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() / 100 != 2) {
                log.warn("Transkripsiya xatosi {}: {}", res.statusCode(), res.body());
                return null;
            }
            JsonNode node = mapper.readTree(res.body());
            return node.path("text").asText(null);
        } catch (Exception e) {
            log.warn("Transkripsiya muvaffaqiyatsiz: {}", e.toString());
            return null;
        }
    }
}
