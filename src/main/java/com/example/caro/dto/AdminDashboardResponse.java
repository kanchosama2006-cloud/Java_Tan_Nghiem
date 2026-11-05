package com.example.caro.dto;

import java.util.List;
import java.util.Map;

public record AdminDashboardResponse(
        long totalUsers,
        long totalGames,
        long totalItemsSold,
        long totalCirculatingCoins,
        long xWins,
        long oWins,
        long draws,
        Map<String, Long> categoryRevenue,
        List<TopSellingItemDto> topSellingItems
) {
    public record TopSellingItemDto(
            Long itemId,
            String itemName,
            String category,
            long soldCount,
            long totalRevenue
    ) {}
}
