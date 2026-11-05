package com.example.caro.dto;

public record LeaderboardRow(int rank, String username, String fullName, int gamesPlayed, int xWins, int oWins, int draws) {
}
