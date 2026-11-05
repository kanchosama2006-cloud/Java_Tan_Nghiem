package com.example.caro.service;

import com.example.caro.exception.BadRequestException;
import com.example.caro.exception.UnauthorizedException;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Service
public class GoogleAuthService {

    private final RestTemplate restTemplate;
    private final String expectedClientId;

    public GoogleAuthService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${caro.oauth.google.client-id:}") String expectedClientId
    ) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
        this.expectedClientId = expectedClientId != null ? expectedClientId.trim() : "";
    }

    public GoogleUserInfo verifyToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException("Google ID token không hợp lệ");
        }

        String verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken.trim();
        TokenInfoResponse tokenInfo;
        try {
            ResponseEntity<TokenInfoResponse> response = restTemplate.getForEntity(verifyUrl, TokenInfoResponse.class);
            tokenInfo = response.getBody();
        } catch (RestClientResponseException ex) {
            throw new UnauthorizedException("Xác thực tài khoản Google thất bại: Token không hợp lệ hoặc đã hết hạn");
        } catch (Exception ex) {
            throw new BadRequestException("Không thể kết nối đến máy chủ Google để xác thực, vui lòng thử lại sau");
        }

        if (tokenInfo == null || tokenInfo.sub == null || tokenInfo.sub.isBlank()) {
            throw new UnauthorizedException("Không thể trích xuất thông tin định danh từ Google");
        }

        // Kiểm tra Audience (client_id) nếu hệ thống đã cấu hình Client ID
        if (!expectedClientId.isEmpty()) {
            if (!expectedClientId.equals(tokenInfo.aud)) {
                throw new UnauthorizedException("Google Token không thuộc về ứng dụng này (Client ID mismatch)");
            }
        }

        // Kiểm tra Issuer
        if (tokenInfo.iss != null && !tokenInfo.iss.contains("accounts.google.com")) {
            throw new UnauthorizedException("Đơn vị phát hành token không hợp lệ");
        }

        String name = tokenInfo.name != null && !tokenInfo.name.isBlank()
                ? tokenInfo.name.trim()
                : (tokenInfo.email != null ? tokenInfo.email.split("@")[0] : "Kỳ thủ Google");

        return new GoogleUserInfo(tokenInfo.sub, tokenInfo.email, name);
    }

    public record GoogleUserInfo(String sub, String email, String name) {}

    public static class TokenInfoResponse {
        public String sub;
        public String email;
        @JsonProperty("email_verified")
        public String emailVerified;
        public String name;
        public String aud;
        public String iss;
        public String exp;
    }
}
