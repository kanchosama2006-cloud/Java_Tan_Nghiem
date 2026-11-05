package com.example.caro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Vui lòng nhập mật khẩu cũ") String oldPassword,
        @NotBlank(message = "Vui lòng nhập mật khẩu mới")
        @Size(min = 6, max = 50, message = "Mật khẩu mới từ 6 đến 50 ký tự")
        String newPassword) {
}
