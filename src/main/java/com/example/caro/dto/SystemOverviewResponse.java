package com.example.caro.dto;

public record SystemOverviewResponse(
        long totalUsers,
        long totalGames,
        long totalMoves,
        long xWins,
        long oWins,
        long draws
) {}
