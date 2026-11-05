package com.example.caro.controller;

import com.example.caro.dto.GoogleLoginRequest;
import com.example.caro.dto.LoginRequest;
import com.example.caro.dto.RegisterRequest;
import com.example.caro.dto.UserResponse;
import com.example.caro.entity.User;
import com.example.caro.service.AuthService;
import com.example.caro.service.GoogleAuthService;
import com.example.caro.service.UserService;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final GoogleAuthService googleAuthService;

    public AuthController(AuthService authService, UserService userService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.userService = userService;
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        User user = authService.authenticate(request.username(), request.password());

        HttpSession old = http.getSession(false);
        if (old != null) {
            old.invalidate();                       // huy phien cu, tranh session fixation
        }
        HttpSession session = http.getSession(true);
        session.setAttribute(SessionUser.USER_ID, user.getId());
        session.setAttribute(SessionUser.ROLE, user.getRole().getName());
        return UserResponse.from(user);
    }

    @PostMapping("/google")
    public UserResponse loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request, HttpServletRequest http) {
        GoogleAuthService.GoogleUserInfo userInfo = googleAuthService.verifyToken(request.idToken());
        User user = authService.authenticateGoogle(userInfo);

        HttpSession old = http.getSession(false);
        if (old != null) {
            old.invalidate();
        }
        HttpSession session = http.getSession(true);
        session.setAttribute(SessionUser.USER_ID, user.getId());
        session.setAttribute(SessionUser.ROLE, user.getRole().getName());
        return UserResponse.from(user);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest http) {
        HttpSession session = http.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return Map.of("message", "Đã đăng xuất");
    }

    /** Lay thong tin nguoi dang dang nhap (dung de kiem tra phien). */
    @GetMapping("/me")
    public UserResponse me(HttpSession session) {
        return userService.getById(SessionUser.id(session));
    }
}
