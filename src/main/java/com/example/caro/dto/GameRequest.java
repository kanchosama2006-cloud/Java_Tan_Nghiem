package com.example.caro.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Client chi gui ten nguoi choi va danh sach nuoc di; ket qua do server tu tinh. */
public record GameRequest(
        @NotBlank(message = "Tên người chơi X không được để trống")
        @Size(max = 50, message = "Tên người chơi X tối đa 50 ký tự")
        String playerX,

        @NotBlank(message = "Tên người chơi O không được để trống")
        @Size(max = 50, message = "Tên người chơi O tối đa 50 ký tự")
        String playerO,

        @NotNull(message = "Thiếu danh sách nước đi")
        @Size(min = 5, max = 120, message = "Một ván có từ 5 đến 120 nước đi")
        @Valid
        List<MoveDto> moves) {
}

