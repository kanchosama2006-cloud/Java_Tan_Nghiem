package com.example.caro.controller;

import com.example.caro.dto.AchievementResponse;
import com.example.caro.service.RewardService;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
public class AchievementController {

    private final RewardService rewardService;

    public AchievementController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    @GetMapping
    public List<AchievementResponse> getAchievements(HttpSession session) {
        return rewardService.getAchievementsForUser(SessionUser.id(session));
    }
}
