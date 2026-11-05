package com.example.caro.service;

import com.example.caro.dto.AchievementResponse;
import com.example.caro.entity.Achievement;
import com.example.caro.entity.CoinTransaction;
import com.example.caro.entity.User;
import com.example.caro.entity.UserAchievement;
import com.example.caro.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RewardService {

    private final UserRepository userRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final CoinTransactionRepository coinTransactionRepository;
    private final GameRepository gameRepository;
    private final UserInventoryRepository userInventoryRepository;

    public RewardService(UserRepository userRepository,
                         AchievementRepository achievementRepository,
                         UserAchievementRepository userAchievementRepository,
                         CoinTransactionRepository coinTransactionRepository,
                         GameRepository gameRepository,
                         UserInventoryRepository userInventoryRepository) {
        this.userRepository = userRepository;
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.coinTransactionRepository = coinTransactionRepository;
        this.gameRepository = gameRepository;
        this.userInventoryRepository = userInventoryRepository;
    }

    /**
     * Thưởng Xu sau trận đấu và kiểm tra mở khóa thành tựu.
     * @return danh sách các thành tựu mới mở khóa trong ván này.
     */
    @Transactional
    public List<Achievement> processGameReward(Long userId, String winner, boolean isAgainstBot, boolean isHardBot, boolean isOnline) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return List.of();

        // 1. Tính toán Xu thưởng
        int rewardAmount = 15; // Thưởng khích lệ tham gia ván
        String desc = "Hoàn thành ván cờ (+15 Xu)";

        boolean isUserWinner = "X".equals(winner); // User luôn là host / player X trong lịch sử
        if (isUserWinner) {
            if (isOnline || isHardBot) {
                rewardAmount = 120;
                desc = "Chiến thắng trận đấu Đỉnh Cao (" + (isOnline ? "Online" : "AI Khó") + ") (+120 Xu)";
            } else {
                rewardAmount = 80;
                desc = "Chiến thắng ván cờ (+80 Xu)";
            }
        } else if ("DRAW".equals(winner)) {
            rewardAmount = 30;
            desc = "Hòa ván cờ (+30 Xu)";
        }

        // Cộng xu vào tài khoản
        user.setCoins(user.getCoins() + rewardAmount);
        userRepository.save(user);

        // Ghi transaction
        CoinTransaction tx = new CoinTransaction(user, rewardAmount, user.getCoins(), "GAME_REWARD", desc);
        coinTransactionRepository.save(tx);

        // 2. Kiểm tra mở khóa thành tựu
        return checkAndUnlockAchievements(user, isUserWinner, isAgainstBot, isOnline);
    }

    @Transactional
    public List<Achievement> checkAndUnlockAchievements(User user, boolean wonGame, boolean isBot, boolean isOnline) {
        List<Achievement> newlyUnlocked = new ArrayList<>();
        List<Achievement> allAchievements = achievementRepository.findAll();
        Set<Long> alreadyUnlockedIds = userAchievementRepository.findByUserId(user.getId())
                .stream()
                .map(ua -> ua.getAchievement().getId())
                .collect(Collectors.toSet());

        // Lấy các chỉ số hiện tại của user
        long totalGames = gameRepository.findByUserIdOrderByStartedAtDesc(user.getId()).size();
        long totalWins = gameRepository.findByUserIdOrderByStartedAtDesc(user.getId()).stream()
                .filter(g -> "X".equals(g.getWinner()))
                .count();
        long totalItemsBought = userInventoryRepository.countByUserId(user.getId());

        for (Achievement a : allAchievements) {
            if (alreadyUnlockedIds.contains(a.getId())) continue;

            boolean conditionMet = false;
            switch (a.getConditionType()) {
                case "TOTAL_GAMES" -> conditionMet = totalGames >= a.getTargetValue();
                case "TOTAL_WINS" -> conditionMet = totalWins >= a.getTargetValue();
                case "BOT_WIN" -> conditionMet = wonGame && isBot;
                case "ONLINE_WIN" -> conditionMet = wonGame && isOnline;
                case "SHOP_BUY" -> conditionMet = totalItemsBought >= a.getTargetValue();
            }

            if (conditionMet) {
                // Mở khóa thành tựu
                UserAchievement ua = new UserAchievement(user, a);
                userAchievementRepository.save(ua);

                // Thưởng Xu thành tựu
                if (a.getRewardCoins() != null && a.getRewardCoins() > 0) {
                    user.setCoins(user.getCoins() + a.getRewardCoins());
                    userRepository.save(user);

                    CoinTransaction tx = new CoinTransaction(
                            user,
                            a.getRewardCoins(),
                            user.getCoins(),
                            "ACHIEVEMENT_REWARD",
                            "Mở khóa danh hiệu: " + a.getTitle() + " (+" + a.getRewardCoins() + " Xu)"
                    );
                    coinTransactionRepository.save(tx);
                }

                newlyUnlocked.add(a);
            }
        }

        return newlyUnlocked;
    }

    @Transactional(readOnly = true)
    public List<AchievementResponse> getAchievementsForUser(Long userId) {
        List<Achievement> all = achievementRepository.findAll();
        List<UserAchievement> userAchs = userAchievementRepository.findByUserId(userId);
        Set<Long> unlockedIds = userAchs.stream()
                .map(ua -> ua.getAchievement().getId())
                .collect(Collectors.toSet());

        long totalGames = gameRepository.findByUserIdOrderByStartedAtDesc(userId).size();
        long totalWins = gameRepository.findByUserIdOrderByStartedAtDesc(userId).stream()
                .filter(g -> "X".equals(g.getWinner()))
                .count();
        long totalItems = userInventoryRepository.countByUserId(userId);

        return all.stream().map(a -> {
            boolean unlocked = unlockedIds.contains(a.getId());
            UserAchievement ua = userAchs.stream().filter(u -> u.getAchievement().getId().equals(a.getId())).findFirst().orElse(null);

            int progress = 0;
            switch (a.getConditionType()) {
                case "TOTAL_GAMES" -> progress = (int) totalGames;
                case "TOTAL_WINS" -> progress = (int) totalWins;
                case "BOT_WIN", "ONLINE_WIN" -> progress = unlocked ? 1 : 0;
                case "SHOP_BUY" -> progress = (int) totalItems;
            }

            return AchievementResponse.from(a, progress, unlocked, ua != null ? ua.getUnlockedAt() : null);
        }).toList();
    }
}
