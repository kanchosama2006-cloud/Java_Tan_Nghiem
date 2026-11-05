package com.example.caro.dto;

import com.example.caro.entity.CoinTransaction;
import java.time.LocalDateTime;

public record CoinTransactionResponse(
        Long id,
        Long userId,
        String username,
        Integer amount,
        Integer balanceAfter,
        String type,
        String description,
        LocalDateTime createdAt
) {
    public static CoinTransactionResponse from(CoinTransaction t) {
        return new CoinTransactionResponse(
                t.getId(),
                t.getUser().getId(),
                t.getUser().getUsername(),
                t.getAmount(),
                t.getBalanceAfter(),
                t.getType(),
                t.getDescription(),
                t.getCreatedAt()
        );
    }
}
