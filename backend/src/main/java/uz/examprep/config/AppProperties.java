package uz.examprep.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Cookie cookie, Demo demo) {

    public record Jwt(
            @NotBlank @Size(min = 32, message = "JWT secret kamida 32 belgidan iborat bo'lishi kerak") String secret,
            @Min(1) int accessTtlMinutes,
            @Min(1) int refreshTtlDays) {}

    public record Cors(List<String> origins) {}

    public record Cookie(boolean secure) {}

    public record Demo(String adminEmail, String adminPassword) {}
}
