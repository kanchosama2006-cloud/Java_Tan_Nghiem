package com.example.caro.config;

import com.example.caro.entity.Achievement;
import com.example.caro.entity.Role;
import com.example.caro.entity.Score;
import com.example.caro.entity.ShopItem;
import com.example.caro.entity.User;
import com.example.caro.repository.AchievementRepository;
import com.example.caro.repository.RoleRepository;
import com.example.caro.repository.ScoreRepository;
import com.example.caro.repository.ShopItemRepository;
import com.example.caro.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Khoi dong he thong: Tao role, admin mac dinh, khoi tao Shop items va Achievements.
 * Ho tro cap nhat so du Xu an toan cho nguoi dung cu.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final ScoreRepository scoreRepository;
    private final PasswordEncoder passwordEncoder;
    private final ShopItemRepository shopItemRepository;
    private final AchievementRepository achievementRepository;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           ScoreRepository scoreRepository,
                           PasswordEncoder passwordEncoder,
                           ShopItemRepository shopItemRepository,
                           AchievementRepository achievementRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.scoreRepository = scoreRepository;
        this.passwordEncoder = passwordEncoder;
        this.shopItemRepository = shopItemRepository;
        this.achievementRepository = achievementRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Role admin = roleRepository.findByName("ADMIN").orElseGet(() -> roleRepository.save(new Role("ADMIN")));
        roleRepository.findByName("PLAYER").orElseGet(() -> roleRepository.save(new Role("PLAYER")));

        if (!userRepository.existsByUsername("admin")) {
            User u = new User();
            u.setUsername("admin");
            u.setPasswordHash(passwordEncoder.encode("admin123"));
            u.setFullName("Grandmaster Admin");
            u.setRole(admin);
            u.setCoins(10000);
            userRepository.save(u);
            scoreRepository.save(new Score(u));
        }

        // Cap nhat xu mac dinh cho cac user cu neu dang co null hoac 0
        List<User> existingUsers = userRepository.findAll();
        for (User u : existingUsers) {
            if (u.getCoins() == null || u.getCoins() <= 0) {
                u.setCoins(500);
                userRepository.save(u);
            }
        }

        seedShopItems();
        seedAchievements();
    }

    private void seedShopItems() {
        // 3 Board Themes
        createShopItemIfNotExists(
                "board-obsidian",
                "Bàn Cờ Hắc Thạch",
                "BOARD_THEME",
                150,
                "board-theme-obsidian",
                "linear-gradient(135deg, #090d16, #141b2d)",
                "Bàn cờ đá bóng đêm sâu thẳm phối viền titan sang trọng"
        );
        createShopItemIfNotExists(
                "board-wood",
                "Bàn Cờ Hoàng Đàn",
                "BOARD_THEME",
                200,
                "board-theme-wood",
                "linear-gradient(135deg, #2b1810, #3d2314)",
                "Gỗ cổ thụ hoàng đàn ngàn năm chạm khắc vân vàng cổ điển"
        );
        createShopItemIfNotExists(
                "board-jade",
                "Bàn Cờ Phỉ Thúy",
                "BOARD_THEME",
                300,
                "board-theme-jade",
                "linear-gradient(135deg, #041f1a, #0b3d32)",
                "Ngọc lục bảo thượng lưu toát lên uy nghiêm của bậc kỳ vương"
        );

        // 3 Piece Skins
        createShopItemIfNotExists(
                "piece-stone",
                "Quân Cờ Bạch Thạch",
                "PIECE_SKIN",
                180,
                "piece-skin-stone",
                "linear-gradient(135deg, #e2e8f0, #94a3b8)",
                "Bạch ngọc và Hắc thiết tối giản, điêu khắc góc cạnh tương phản"
        );
        createShopItemIfNotExists(
                "piece-amber",
                "Quân Cờ Hổ Phách",
                "PIECE_SKIN",
                250,
                "piece-skin-amber",
                "linear-gradient(135deg, #d97706, #f59e0b)",
                "Ánh kim hổ phách rực lửa mang năng lượng chiến thắng"
        );
        createShopItemIfNotExists(
                "piece-crimson",
                "Quân Cờ Huyết Lân",
                "PIECE_SKIN",
                350,
                "piece-skin-crimson",
                "linear-gradient(135deg, #991b1b, #ef4444)",
                "Huyết ngọc long lân uy vũ, sắc sảo bậc nhất đấu trường"
        );

        // 3 Avatar Frames
        createShopItemIfNotExists(
                "frame-platinum",
                "Khung Bạch Kim",
                "AVATAR_FRAME",
                120,
                "frame-platinum",
                "linear-gradient(135deg, #cbd5e1, #f8fafc)",
                "Viền bạch kim tinh tế dành cho kỳ thủ thanh lịch"
        );
        createShopItemIfNotExists(
                "frame-imperial",
                "Khung Hoàng Gia",
                "AVATAR_FRAME",
                280,
                "frame-imperial",
                "linear-gradient(135deg, #d4af37, #fef08a)",
                "Kim quan hoàng gia lấp lánh biểu trưng tột đỉnh quyền lực"
        );
        createShopItemIfNotExists(
                "frame-cosmic",
                "Khung Hư Không",
                "AVATAR_FRAME",
                400,
                "frame-cosmic",
                "linear-gradient(135deg, #6366f1, #a855f7)",
                "Hào quang đa chiều vũ trụ bao bọc ảnh đại diện"
        );
    }

    private void createShopItemIfNotExists(String code, String name, String category, int price,
                                           String cssClass, String previewGradient, String description) {
        if (!shopItemRepository.existsByCode(code)) {
            ShopItem item = new ShopItem();
            item.setCode(code);
            item.setName(name);
            item.setCategory(category);
            item.setPrice(price);
            item.setCssClass(cssClass);
            item.setPreviewGradient(previewGradient);
            item.setDescription(description);
            item.setActive(true);
            shopItemRepository.save(item);
        }
    }

    private void seedAchievements() {
        createAchievementIfNotExists(
                "FIRST_BLOOD",
                "Chiến Thắng Đầu Tiên",
                "Giành chiến thắng ván cờ đầu tiên trong sự nghiệp",
                "TOTAL_WINS",
                1,
                50
        );
        createAchievementIfNotExists(
                "WARRIOR_10",
                "Chiến Binh Đấu Trường",
                "Hoàn thành 10 ván cờ bất kỳ",
                "TOTAL_GAMES",
                10,
                100
        );
        createAchievementIfNotExists(
                "BOT_SLAYER",
                "Khắc Tinh Trí Tuệ",
                "Đánh bại AI Bot cấp độ Cao Thủ (Hard)",
                "BOT_WIN",
                1,
                150
        );
        createAchievementIfNotExists(
                "ONLINE_CONQUEROR",
                "Kỳ Vương Trực Tuyến",
                "Chiến thắng đối thủ trong phòng thi đấu trực tuyến",
                "ONLINE_WIN",
                1,
                200
        );
        createAchievementIfNotExists(
                "FASHION_COLLECTOR",
                "Nhà Sưu Tập",
                "Sở hữu vật phẩm đầu tiên trong Cửa Hàng Đấu Trường",
                "SHOP_BUY",
                1,
                80
        );
        createAchievementIfNotExists(
                "GRANDMASTER_50",
                "Đại Kiện Tướng",
                "Giành chiến thắng tổng cộng 50 ván cờ vinh quang",
                "TOTAL_WINS",
                50,
                500
        );
    }

    private void createAchievementIfNotExists(String code, String title, String description,
                                              String conditionType, int targetValue, int rewardCoins) {
        if (!achievementRepository.existsByCode(code)) {
            Achievement a = new Achievement();
            a.setCode(code);
            a.setTitle(title);
            a.setDescription(description);
            a.setConditionType(conditionType);
            a.setTargetValue(targetValue);
            a.setRewardCoins(rewardCoins);
            achievementRepository.save(a);
        }
    }
}
