package com.example.caro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ShopItemRequest(
        @NotBlank(message = "Mã vật phẩm không được để trống")
        @Size(max = 50, message = "Mã vật phẩm tối đa 50 ký tự")
        String code,

        @NotBlank(message = "Tên vật phẩm không được để trống")
        @Size(max = 100, message = "Tên vật phẩm tối đa 100 ký tự")
        String name,

        @NotBlank(message = "Danh mục không được để trống")
        String category,

        @NotNull(message = "Thiếu giá vật phẩm")
        @PositiveOrZero(message = "Giá vật phẩm không thể âm")
        Integer price,

        @NotBlank(message = "CSS class không được để trống")
        String cssClass,

        String previewGradient,

        String description,

        Boolean active
) {}
