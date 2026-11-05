package com.example.caro.service;

import com.example.caro.dto.AdminDashboardResponse;
import com.example.caro.dto.CoinTransactionResponse;
import com.example.caro.dto.GameResponse;
import com.example.caro.dto.ShopItemRequest;
import com.example.caro.dto.ShopItemResponse;
import com.example.caro.dto.SystemOverviewResponse;
import com.example.caro.dto.UserResponse;
import com.example.caro.entity.*;
import com.example.caro.exception.BadRequestException;
import com.example.caro.exception.ResourceNotFoundException;
import com.example.caro.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final GameRepository gameRepository;
    private final MoveRepository moveRepository;
    private final ScoreRepository scoreRepository;
    private final ShopItemRepository shopItemRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final CoinTransactionRepository coinTransactionRepository;
    private final GameCommentRepository gameCommentRepository;
    private final UserService userService;

    public AdminService(UserRepository userRepository,
                        RoleRepository roleRepository,
                        GameRepository gameRepository,
                        MoveRepository moveRepository,
                        ScoreRepository scoreRepository,
                        ShopItemRepository shopItemRepository,
                        UserInventoryRepository userInventoryRepository,
                        CoinTransactionRepository coinTransactionRepository,
                        GameCommentRepository gameCommentRepository,
                        UserService userService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.gameRepository = gameRepository;
        this.moveRepository = moveRepository;
        this.scoreRepository = scoreRepository;
        this.shopItemRepository = shopItemRepository;
        this.userInventoryRepository = userInventoryRepository;
        this.coinTransactionRepository = coinTransactionRepository;
        this.gameCommentRepository = gameCommentRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public SystemOverviewResponse getOverview() {
        long totalUsers = userRepository.count();
        long totalGames = gameRepository.count();
        long totalMoves = moveRepository.count();
        long xWins = gameRepository.countByWinner("X");
        long oWins = gameRepository.countByWinner("O");
        long draws = gameRepository.countByWinner("DRAW");

        return new SystemOverviewResponse(totalUsers, totalGames, totalMoves, xWins, oWins, draws);
    }

    /** Dashboard chi tiết chuẩn E-Commerce & Game Platform */
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        long totalUsers = userRepository.count();
        long totalGames = gameRepository.count();
        long totalItemsSold = userInventoryRepository.count();

        long circulatingCoins = userRepository.findAll().stream()
                .mapToLong(User::getCoins)
                .sum();

        long xWins = gameRepository.countByWinner("X");
        long oWins = gameRepository.countByWinner("O");
        long draws = gameRepository.countByWinner("DRAW");

        // Doanh thu theo danh mục
        Map<String, Long> categoryRevenue = new HashMap<>();
        categoryRevenue.put("BOARD_THEME", 0L);
        categoryRevenue.put("PIECE_SKIN", 0L);
        categoryRevenue.put("AVATAR_FRAME", 0L);

        List<UserInventory> allSales = userInventoryRepository.findAll();
        Map<Long, Long> itemSalesCount = new HashMap<>();

        for (UserInventory inv : allSales) {
            ShopItem it = inv.getItem();
            String cat = it.getCategory();
            categoryRevenue.put(cat, categoryRevenue.getOrDefault(cat, 0L) + it.getPrice());
            itemSalesCount.put(it.getId(), itemSalesCount.getOrDefault(it.getId(), 0L) + 1);
        }

        // Top bán chạy
        List<AdminDashboardResponse.TopSellingItemDto> topSelling = itemSalesCount.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    ShopItem it = shopItemRepository.findById(e.getKey()).orElse(null);
                    if (it == null) return null;
                    return new AdminDashboardResponse.TopSellingItemDto(
                            it.getId(),
                            it.getName(),
                            it.getCategory(),
                            e.getValue(),
                            e.getValue() * it.getPrice()
                    );
                })
                .filter(Objects::nonNull)
                .toList();

        return new AdminDashboardResponse(
                totalUsers, totalGames, totalItemsSold, circulatingCoins,
                xWins, oWins, draws, categoryRevenue, topSelling
        );
    }

    // ===== CRUD SHOP ITEMS CHO ADMIN =====
    @Transactional(readOnly = true)
    public List<ShopItemResponse> listAllShopItems() {
        return shopItemRepository.findAll().stream()
                .map(i -> ShopItemResponse.from(i, false, false))
                .toList();
    }

    @Transactional
    public ShopItemResponse createShopItem(ShopItemRequest req) {
        if (shopItemRepository.existsByCode(req.code().trim().toUpperCase())) {
            throw new BadRequestException("Mã vật phẩm '" + req.code() + "' đã tồn tại");
        }
        String gradient = (req.previewGradient() != null && !req.previewGradient().isBlank())
                ? req.previewGradient().trim()
                : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
        ShopItem item = new ShopItem(
                req.code().trim().toUpperCase(),
                req.name().trim(),
                req.category().trim().toUpperCase(),
                req.price(),
                req.cssClass().trim(),
                gradient,
                req.description() != null ? req.description().trim() : ""
        );
        item.setActive(req.active() == null || req.active());
        return ShopItemResponse.from(shopItemRepository.save(item), false, false);
    }

    @Transactional
    public ShopItemResponse updateShopItem(Long id, ShopItemRequest req) {
        ShopItem item = shopItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vật phẩm id = " + id));

        item.setName(req.name().trim());
        item.setCategory(req.category().trim().toUpperCase());
        item.setPrice(req.price());
        item.setCssClass(req.cssClass().trim());
        if (req.previewGradient() != null && !req.previewGradient().isBlank()) {
            item.setPreviewGradient(req.previewGradient().trim());
        }
        item.setDescription(req.description() != null ? req.description().trim() : "");
        if (req.active() != null) {
            item.setActive(req.active());
        }
        return ShopItemResponse.from(shopItemRepository.save(item), false, false);
    }

    @Transactional
    public void deleteShopItem(Long id) {
        ShopItem item = shopItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vật phẩm id = " + id));

        // Nếu đã có người mua thì chuyển thành active = false (ngừng kinh doanh) để bảo toàn inventory
        item.setActive(false);
        shopItemRepository.save(item);
    }

    // ===== GIAO DỊCH XU & CẤP XU =====
    @Transactional(readOnly = true)
    public List<CoinTransactionResponse> listAllTransactions() {
        return coinTransactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(CoinTransactionResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse adjustCoins(Long targetUserId, Integer amount, String reason, Long adminUserId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id = " + targetUserId));

        int newBalance = Math.max(0, target.getCoins() + amount);
        target.setCoins(newBalance);
        userRepository.save(target);

        String desc = (reason != null && !reason.isBlank()) ? reason.trim() : "Quản trị viên điều chỉnh số dư";
        CoinTransaction tx = new CoinTransaction(target, amount, newBalance, "ADMIN_ADJUST", desc);
        coinTransactionRepository.save(tx);

        return UserResponse.from(target);
    }

    // ===== BÌNH LUẬN =====
    @Transactional(readOnly = true)
    public List<GameComment> listAllComments() {
        return gameCommentRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void deleteComment(Long id) {
        GameComment c = gameCommentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận id = " + id));
        gameCommentRepository.delete(c);
    }

    // ===== USER MANAGEMENT =====
    @Transactional
    public UserResponse toggleRole(Long userId, Long currentUserId) {
        if (userId.equals(currentUserId)) {
            throw new BadRequestException("Không thể tự thay đổi vai trò của chính mình");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng có id = " + userId));

        String currentRoleName = user.getRole().getName();
        String targetRoleName = "ADMIN".equalsIgnoreCase(currentRoleName) ? "PLAYER" : "ADMIN";

        Role newRole = roleRepository.findByName(targetRoleName)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò " + targetRoleName));

        user.setRole(newRole);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void resetScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng có id = " + userId));

        Score score = scoreRepository.findByUserId(userId).orElseGet(() -> new Score(user));
        score.setGamesPlayed(0);
        score.setXWins(0);
        score.setOWins(0);
        score.setDraws(0);
        scoreRepository.save(score);
    }

    @Transactional(readOnly = true)
    public List<GameResponse> listAllGames() {
        return gameRepository.findAllByOrderByStartedAtDesc()
                .stream()
                .map(GameResponse::summary)
                .toList();
    }

    @Transactional
    public void deleteGame(Long gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ván cờ có id = " + gameId));

        scoreRepository.findByUserId(game.getUser().getId()).ifPresent(s -> {
            s.apply(game.getWinner(), -1);
            scoreRepository.save(s);
        });

        gameRepository.delete(game);
    }
}

