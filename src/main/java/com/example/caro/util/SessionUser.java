package com.example.caro.util;

import com.example.caro.exception.ForbiddenException;
import com.example.caro.exception.UnauthorizedException;
import jakarta.servlet.http.HttpSession;

/** Doc thong tin nguoi dang nhap tu HttpSession. */
public final class SessionUser {

    public static final String USER_ID = "userId";
    public static final String ROLE = "role";

    private SessionUser() {
    }

    public static Long id(HttpSession session) {
        Object id = session.getAttribute(USER_ID);
        if (id == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return (Long) id;
    }

    public static boolean isAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute(ROLE));
    }

    public static void requireAdmin(HttpSession session) {
        if (!isAdmin(session)) {
            throw new ForbiddenException("Chỉ ADMIN mới được thực hiện chức năng này");
        }
    }
}
