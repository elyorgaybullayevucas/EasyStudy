package uz.easystudy.service;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {
    private final HttpStatus status;

    public AppException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static AppException badRequest(String m) { return new AppException(HttpStatus.BAD_REQUEST, m); }
    public static AppException unauthorized(String m) { return new AppException(HttpStatus.UNAUTHORIZED, m); }
    public static AppException forbidden(String m) { return new AppException(HttpStatus.FORBIDDEN, m); }
    public static AppException notFound(String m) { return new AppException(HttpStatus.NOT_FOUND, m); }
    public static AppException conflict(String m) { return new AppException(HttpStatus.CONFLICT, m); }
}
