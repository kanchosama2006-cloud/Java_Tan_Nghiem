package com.example.caro.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateRoomRequest(
        @NotNull(message = "Thiếu kích thước bàn cờ")
        @Min(value = 3, message = "Kích thước bàn cờ tối thiểu 3")
        @Max(value = 10, message = "Kích thước bàn cờ tối đa 10")
        Integer boardSize,

        @Pattern(regexp = "^(INFINITE|CLASSIC)$", message = "Chế độ phải là INFINITE hoặc CLASSIC")
        String gameMode
) {}
