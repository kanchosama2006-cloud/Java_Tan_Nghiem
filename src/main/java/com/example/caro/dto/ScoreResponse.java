package com.example.caro.dto;

import com.example.caro.entity.Score;

public record ScoreResponse(int gamesPlayed, int xWins, int oWins, int draws) {

    public static ScoreResponse from(Score s) {
        return new ScoreResponse(s.getGamesPlayed(), s.getXWins(), s.getOWins(), s.getDraws());
    }

    public static ScoreResponse empty() {
        return new ScoreResponse(0, 0, 0, 0);
    }
}
