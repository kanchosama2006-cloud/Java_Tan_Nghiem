package com.example.caro.dto;

public record EquippedCosmeticsResponse(
        String boardThemeClass,
        String pieceSkinClass,
        String avatarFrameClass,
        Integer coins,
        String boardThemeGradient,
        String pieceSkinGradient,
        String avatarFrameGradient
) {
    public EquippedCosmeticsResponse(String boardThemeClass, String pieceSkinClass, String avatarFrameClass, Integer coins) {
        this(boardThemeClass, pieceSkinClass, avatarFrameClass, coins, null, null, null);
    }
}
