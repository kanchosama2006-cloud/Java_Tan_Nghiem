package com.example.caro.dto;

import com.example.caro.entity.Achievement;
import java.time.LocalDateTime;

public record AchievementResponse(
        Long id,
        String code,
        String title,
        String description,
        String conditionType,
        Integer targetValue,
        Integer rewardCoins,
        Integer currentProgress,
        boolean unlocked,
        LocalDateTime unlockedAt
) {
    public static AchievementResponse from(Achievement a, int progress, boolean unlocked, LocalDateTime unlockedAt) {
        return new AchievementResponse(
                a.getId(),
                a.getCode(),
                a.getTitle(),
                a.getDescription(),
                a.getConditionType(),
                a.getTargetValue(),
                a.getRewardCoins(),
                Math.min(progress, a.getTargetValue()),
                unlocked,
                unlockedAt
        );
    }
}
