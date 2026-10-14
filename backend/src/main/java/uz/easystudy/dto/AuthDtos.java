package uz.easystudy.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 10, max = 128)
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Parolda harf va raqam bo'lishi shart")
            String password,
            @NotBlank @Size(min = 2, max = 255) String fullName) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record TokenResponse(String accessToken, long expiresIn, UserResponse user) {}

    public record UserResponse(Long id, String email, String fullName, String role) {}
}
