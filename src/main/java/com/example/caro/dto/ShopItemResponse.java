package com.example.caro.dto;

import com.example.caro.entity.ShopItem;

public record ShopItemResponse(
        Long id,
        String code,
        String name,
        String category,
        Integer price,
        String cssClass,
        String previewGradient,
        String description,
        Boolean active,
        boolean owned,
        boolean equipped
) {
    public static ShopItemResponse from(ShopItem item, boolean owned, boolean equipped) {
        return new ShopItemResponse(
                item.getId(),
                item.getCode(),
                item.getName(),
                item.getCategory(),
                item.getPrice(),
                item.getCssClass(),
                item.getPreviewGradient(),
                item.getDescription(),
                item.getActive(),
                owned,
                equipped
        );
    }
}
