package com.example.caro.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BotMoveRequest(
        @NotNull(message = "Thiếu kích thước bàn cờ")
        Integer boardSize,

        String mode, // "INFINITE" hoặc "CLASSIC"

        String difficulty, // "EASY", "MEDIUM", "HARD"

        @Valid
        List<MoveDto> moves
) {}
