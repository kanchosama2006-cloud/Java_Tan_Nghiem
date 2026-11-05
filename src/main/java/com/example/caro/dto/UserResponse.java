package com.example.caro.dto;

import com.example.caro.entity.User;

import java.time.LocalDateTime;

/** Du lieu tra ve cho client: KHONG co mat khau. */
public record UserResponse(Long id, String username, String fullName, String role, Integer coins, LocalDateTime createdAt) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getRole().getName(), u.getCoins(), u.getCreatedAt());
    }
}

