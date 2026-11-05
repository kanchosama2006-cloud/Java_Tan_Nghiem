package com.example.caro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Cap nhat ten nguoi choi cua mot van da luu. */
public record GameUpdateRequest(
        @NotBlank(message = "Tên người chơi X không được để trống")
        @Size(max = 50, message = "Tên người chơi X tối đa 50 ký tự")
        String playerX,

        @NotBlank(message = "Tên người chơi O không được để trống")
        @Size(max = 50, message = "Tên người chơi O tối đa 50 ký tự")
        String playerO) {
}
