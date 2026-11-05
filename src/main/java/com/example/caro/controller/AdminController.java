package com.example.caro.controller;

import com.example.caro.dto.*;
import com.example.caro.entity.GameComment;
import com.example.caro.service.AdminService;
import com.example.caro.service.UserService;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    public AdminController(AdminService adminService, UserService userService) {
        this.adminService = adminService;
        this.userService = userService;
    }

    @GetMapping("/overview")
    public SystemOverviewResponse getOverview(HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.getOverview();
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse getDashboard(HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.getDashboard();
    }

    // ===== SHOP CRUD FOR ADMIN =====
    @GetMapping("/shop-items")
    public List<ShopItemResponse> listShopItems(HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.listAllShopItems();
    }

    @PostMapping("/shop-items")
    public ShopItemResponse createShopItem(@Valid @RequestBody ShopItemRequest request, HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.createShopItem(request);
    }

    @PutMapping("/shop-items/{id}")
    public ShopItemResponse updateShopItem(@PathVariable("id") Long id, @Valid @RequestBody ShopItemRequest request, HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.updateShopItem(id, request);
    }

    @DeleteMapping("/shop-items/{id}")
    public Map<String, String> deleteShopItem(@PathVariable("id") Long id, HttpSession session) {
        SessionUser.requireAdmin(session);
        adminService.deleteShopItem(id);
        return Map.of("message", "Đã cập nhật trạng thái ngừng kinh doanh vật phẩm");
    }

    // ===== GIAO DỊCH & CẤP XU =====
    @GetMapping("/transactions")
    public List<CoinTransactionResponse> listTransactions(HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.listAllTransactions();
    }

    @PostMapping("/users/{id}/coins")
    public UserResponse adjustCoins(@PathVariable("id") Long id, @Valid @RequestBody AdjustCoinsRequest request, HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.adjustCoins(id, request.amount(), request.reason(), SessionUser.id(session));
    }

    // ===== KIỂM DUYỆT BÌNH LUẬN =====
    @GetMapping("/comments")
    public List<GameCommentResponse> listComments(HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.listAllComments().stream()
                .map(c -> GameCommentResponse.from(c, null))
                .toList();
    }

    @DeleteMapping("/comments/{id}")
    public Map<String, String> deleteComment(@PathVariable("id") Long id, HttpSession session) {
        SessionUser.requireAdmin(session);
        adminService.deleteComment(id);
        return Map.of("message", "Đã xóa bình luận thành công");
    }

    // ===== USER MANAGEMENT =====
    @GetMapping("/users")
    public List<UserResponse> listUsers(HttpSession session) {
        SessionUser.requireAdmin(session);
        return userService.listAll();
    }

    @PutMapping("/users/{id}/role")
    public UserResponse toggleRole(@PathVariable("id") Long id, HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.toggleRole(id, SessionUser.id(session));
    }

    @PostMapping("/users/{id}/reset-score")
    public Map<String, String> resetScore(@PathVariable("id") Long id, HttpSession session) {
        SessionUser.requireAdmin(session);
        adminService.resetScore(id);
        return Map.of("message", "Đã reset điểm thành công về 0");
    }

    @DeleteMapping("/users/{id}")
    public Map<String, String> deleteUser(@PathVariable("id") Long id, HttpSession session) {
        SessionUser.requireAdmin(session);
        userService.delete(id, SessionUser.id(session));
        return Map.of("message", "Đã xóa tài khoản thành công");
    }

    @GetMapping("/games")
    public List<GameResponse> listGames(HttpSession session) {
        SessionUser.requireAdmin(session);
        return adminService.listAllGames();
    }

    @DeleteMapping("/games/{id}")
    public Map<String, String> deleteGame(@PathVariable("id") Long id, HttpSession session) {
        SessionUser.requireAdmin(session);
        adminService.deleteGame(id);
        return Map.of("message", "Đã xóa ván cờ thành công");
    }
}

