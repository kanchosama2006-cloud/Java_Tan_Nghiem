package com.example.caro.dto;

import jakarta.validation.constraints.NotNull;

public record AdjustCoinsRequest(
        @NotNull(message = "Thiếu số lượng xu thay đổi")
        Integer amount, // dương hoặc âm

        String reason
) {}
