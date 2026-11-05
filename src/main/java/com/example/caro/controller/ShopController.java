package com.example.caro.controller;

import com.example.caro.dto.CoinTransactionResponse;
import com.example.caro.dto.EquippedCosmeticsResponse;
import com.example.caro.dto.ShopItemResponse;
import com.example.caro.service.ShopService;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    @GetMapping("/items")
    public List<ShopItemResponse> getItems(@RequestParam(value = "category", required = false) String category,
                                           @RequestParam(value = "search", required = false) String search,
                                           HttpSession session) {
        return shopService.getStorefront(SessionUser.id(session), category, search);
    }

    @PostMapping("/buy/{itemId}")
    public ShopItemResponse buyItem(@PathVariable("itemId") Long itemId, HttpSession session) {
        return shopService.buyItem(SessionUser.id(session), itemId);
    }

    @PostMapping("/equip/{itemId}")
    public EquippedCosmeticsResponse equipItem(@PathVariable("itemId") Long itemId, HttpSession session) {
        return shopService.equipItem(SessionUser.id(session), itemId);
    }

    @GetMapping("/my-equipped")
    public EquippedCosmeticsResponse getMyEquipped(HttpSession session) {
        return shopService.getEquippedCosmetics(SessionUser.id(session));
    }

    @GetMapping("/transactions")
    public List<CoinTransactionResponse> getTransactions(HttpSession session) {
        return shopService.getTransactions(SessionUser.id(session));
    }
}
