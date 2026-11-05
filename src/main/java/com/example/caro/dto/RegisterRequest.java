package com.example.caro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống")
        @Size(min = 3, max = 50, message = "Tên đăng nhập từ 3 đến 50 ký tự")
        @Pattern(regexp = "^[A-Za-z0-9_.]+$", message = "Tên đăng nhập chỉ gồm chữ, số, dấu _ và .")
        String username,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, max = 50, message = "Mật khẩu từ 6 đến 50 ký tự")
        String password,

        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName) {
}
