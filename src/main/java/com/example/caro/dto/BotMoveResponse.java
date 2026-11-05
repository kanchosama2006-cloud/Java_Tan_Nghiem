package com.example.caro.dto;

public record BotMoveResponse(
        int row,
        int col,
        String botName,
        String difficulty,
        String reasoning
) {}
