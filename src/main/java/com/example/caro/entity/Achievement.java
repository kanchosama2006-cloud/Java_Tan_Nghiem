package com.example.caro.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "achievements")
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 255)
    private String description;

    @Column(name = "condition_type", nullable = false, length = 30)
    private String conditionType; // 'TOTAL_GAMES', 'TOTAL_WINS', 'BOT_WIN', 'ONLINE_WIN', 'SHOP_BUY'

    @Column(name = "target_value", nullable = false)
    private Integer targetValue;

    @Column(name = "reward_coins", nullable = false)
    private Integer rewardCoins;

    public Achievement() {
    }

    public Achievement(String code, String title, String description, String conditionType, Integer targetValue, Integer rewardCoins) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.conditionType = conditionType;
        this.targetValue = targetValue;
        this.rewardCoins = rewardCoins;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getConditionType() {
        return conditionType;
    }

    public void setConditionType(String conditionType) {
        this.conditionType = conditionType;
    }

    public Integer getTargetValue() {
        return targetValue;
    }

    public void setTargetValue(Integer targetValue) {
        this.targetValue = targetValue;
    }

    public Integer getRewardCoins() {
        return rewardCoins;
    }

    public void setRewardCoins(Integer rewardCoins) {
        this.rewardCoins = rewardCoins;
    }
}
