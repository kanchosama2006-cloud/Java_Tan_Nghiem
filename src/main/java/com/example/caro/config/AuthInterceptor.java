package com.example.caro.config;

import com.example.caro.exception.UnauthorizedException;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

/** Chan moi API neu chua dang nhap (tru dang ky / dang nhap / Preflight CORS OPTIONS). */
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Cho phep CORS Preflight OPTIONS request di qua khong can session
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute(SessionUser.USER_ID) == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return true;
    }
}
