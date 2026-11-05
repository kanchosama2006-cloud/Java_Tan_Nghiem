package com.example.caro.controller;

import com.example.caro.dto.LeaderboardRow;
import com.example.caro.dto.ScoreResponse;
import com.example.caro.service.LeaderboardService;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/leaderboard")
    public List<LeaderboardRow> leaderboard() {
        return leaderboardService.top10();
    }

    @GetMapping("/scores/me")
    public ScoreResponse myScore(HttpSession session) {
        return leaderboardService.myScore(SessionUser.id(session));
    }
}
