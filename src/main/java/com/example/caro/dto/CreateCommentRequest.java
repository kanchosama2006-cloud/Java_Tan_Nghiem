package com.example.caro.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotNull(message = "Thiếu số sao đánh giá")
        @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
        @Max(value = 5, message = "Đánh giá tối đa 5 sao")
        Integer rating,

        @NotBlank(message = "Nội dung bình luận không được để trống")
        @Size(max = 500, message = "Nội dung bình luận tối đa 500 ký tự")
        String content
) {}
