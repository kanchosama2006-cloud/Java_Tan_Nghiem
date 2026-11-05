package com.example.caro.controller;

import com.example.caro.dto.ChangePasswordRequest;
import com.example.caro.dto.UpdateProfileRequest;
import com.example.caro.dto.UserResponse;
import com.example.caro.service.UserService;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** Chi ADMIN: danh sach tai khoan. */
    @GetMapping
    public List<UserResponse> list(HttpSession session) {
        SessionUser.requireAdmin(session);
        return userService.listAll();
    }

    /** Chi ADMIN: xoa tai khoan. */
    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable("id") Long id, HttpSession session) {
        SessionUser.requireAdmin(session);
        userService.delete(id, SessionUser.id(session));
        return Map.of("message", "Đã xóa tài khoản");
    }
// update profile cua chinh minh
    @PutMapping("/me")
    public UserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request, HttpSession session) {
        return userService.updateProfile(SessionUser.id(session), request);
    }
// update password cua chinh minh
    @PutMapping("/me/password")
    public Map<String, String> changePassword(@Valid @RequestBody ChangePasswordRequest request, HttpSession session) {
        userService.changePassword(SessionUser.id(session), request);
        return Map.of("message", "Đổi mật khẩu thành công");
    }
}
