package com.example.caro.service;

import com.example.caro.dto.CoinTransactionResponse;
import com.example.caro.dto.EquippedCosmeticsResponse;
import com.example.caro.dto.ShopItemResponse;
import com.example.caro.entity.CoinTransaction;
import com.example.caro.entity.ShopItem;
import com.example.caro.entity.User;
import com.example.caro.entity.UserInventory;
import com.example.caro.exception.BadRequestException;
import com.example.caro.exception.ResourceNotFoundException;
import com.example.caro.repository.CoinTransactionRepository;
import com.example.caro.repository.ShopItemRepository;
import com.example.caro.repository.UserInventoryRepository;
import com.example.caro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ShopService {

    private final ShopItemRepository shopItemRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final UserRepository userRepository;
    private final CoinTransactionRepository coinTransactionRepository;
    private final RewardService rewardService;

    public ShopService(ShopItemRepository shopItemRepository,
                       UserInventoryRepository userInventoryRepository,
                       UserRepository userRepository,
                       CoinTransactionRepository coinTransactionRepository,
                       RewardService rewardService) {
        this.shopItemRepository = shopItemRepository;
        this.userInventoryRepository = userInventoryRepository;
        this.userRepository = userRepository;
        this.coinTransactionRepository = coinTransactionRepository;
        this.rewardService = rewardService;
    }

    @Transactional(readOnly = true)
    public List<ShopItemResponse> getStorefront(Long userId, String category, String search) {
        List<ShopItem> items = shopItemRepository.findByActiveTrue();
        List<UserInventory> inventory = userInventoryRepository.findByUserId(userId);
        Set<Long> ownedIds = inventory.stream().map(ui -> ui.getItem().getId()).collect(Collectors.toSet());
        Set<Long> equippedIds = inventory.stream().filter(UserInventory::getEquipped).map(ui -> ui.getItem().getId()).collect(Collectors.toSet());

        return items.stream()
                .filter(i -> category == null || category.isBlank() || i.getCategory().equalsIgnoreCase(category.trim()))
                .filter(i -> search == null || search.isBlank() || i.getName().toLowerCase().contains(search.trim().toLowerCase()))
                .map(i -> ShopItemResponse.from(i, ownedIds.contains(i.getId()), equippedIds.contains(i.getId())))
                .toList();
    }

    @Transactional
    public ShopItemResponse buyItem(Long userId, Long itemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        ShopItem item = shopItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vật phẩm"));

        if (!item.getActive()) {
            throw new BadRequestException("Vật phẩm này hiện đang ngừng bán");
        }

        if (userInventoryRepository.existsByUserIdAndItemId(userId, itemId)) {
            throw new BadRequestException("Bạn đã sở hữu vật phẩm này rồi");
        }

        if (user.getCoins() < item.getPrice()) {
            throw new BadRequestException("Số dư Xu không đủ (Cần " + item.getPrice() + " Xu, bạn hiện có " + user.getCoins() + " Xu)");
        }

        // Trừ Xu
        user.setCoins(user.getCoins() - item.getPrice());
        userRepository.save(user);

        // Thêm vào kho đồ
        UserInventory inv = new UserInventory(user, item);
        userInventoryRepository.save(inv);

        // Ghi transaction
        CoinTransaction tx = new CoinTransaction(
                user,
                -item.getPrice(),
                user.getCoins(),
                "SHOP_PURCHASE",
                "Mua vật phẩm: " + item.getName() + " (-" + item.getPrice() + " Xu)"
        );
        coinTransactionRepository.save(tx);

        // Kiểm tra thành tựu "Nhà Sưu Tập"
        rewardService.checkAndUnlockAchievements(user, false, false, false);

        return ShopItemResponse.from(item, true, false);
    }

    @Transactional
    public EquippedCosmeticsResponse equipItem(Long userId, Long itemId) {
        UserInventory target = userInventoryRepository.findByUserIdAndItemId(userId, itemId)
                .orElseThrow(() -> new BadRequestException("Bạn chưa sở hữu vật phẩm này"));

        String targetCat = target.getItem().getCategory();
        boolean currentlyEquipped = target.getEquipped();

        // Gỡ trang bị của tất cả vật phẩm cùng Category của user
        List<UserInventory> allUserItems = userInventoryRepository.findByUserId(userId);
        for (UserInventory ui : allUserItems) {
            if (ui.getItem().getCategory().equalsIgnoreCase(targetCat)) {
                ui.setEquipped(false);
            }
        }

        // Nếu trước đó chưa trang bị -> Bật trang bị. Nếu đang trang bị rồi bấm lần nữa -> Đã gỡ về mặc định
        if (!currentlyEquipped) {
            target.setEquipped(true);
        }
        userInventoryRepository.saveAll(allUserItems);

        return getEquippedCosmetics(userId);
    }

    @Transactional(readOnly = true)
    public EquippedCosmeticsResponse getEquippedCosmetics(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        List<UserInventory> equipped = userInventoryRepository.findByUserIdAndEquippedTrue(userId);

        String boardTheme = null;
        String pieceSkin = null;
        String avatarFrame = null;
        String boardThemeGradient = null;
        String pieceSkinGradient = null;
        String avatarFrameGradient = null;

        for (UserInventory ui : equipped) {
            ShopItem item = ui.getItem();
            switch (item.getCategory()) {
                case "BOARD_THEME" -> {
                    boardTheme = item.getCssClass();
                    boardThemeGradient = item.getPreviewGradient();
                }
                case "PIECE_SKIN" -> {
                    pieceSkin = item.getCssClass();
                    pieceSkinGradient = item.getPreviewGradient();
                }
                case "AVATAR_FRAME" -> {
                    avatarFrame = item.getCssClass();
                    avatarFrameGradient = item.getPreviewGradient();
                }
            }
        }

        return new EquippedCosmeticsResponse(boardTheme, pieceSkin, avatarFrame, user.getCoins(), boardThemeGradient, pieceSkinGradient, avatarFrameGradient);
    }

    @Transactional(readOnly = true)
    public List<CoinTransactionResponse> getTransactions(Long userId) {
        return coinTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(CoinTransactionResponse::from)
                .toList();
    }
}
