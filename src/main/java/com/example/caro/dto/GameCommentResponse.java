package com.example.caro.dto;

import com.example.caro.entity.GameComment;
import java.time.LocalDateTime;

public record GameCommentResponse(
        Long id,
        Long gameId,
        Long userId,
        String username,
        String fullName,
        String avatarFrameClass,
        Integer rating,
        String content,
        LocalDateTime createdAt
) {
    public static GameCommentResponse from(GameComment c, String avatarFrameClass) {
        return new GameCommentResponse(
                c.getId(),
                c.getGame().getId(),
                c.getUser().getId(),
                c.getUser().getUsername(),
                c.getUser().getFullName(),
                avatarFrameClass,
                c.getRating(),
                c.getContent(),
                c.getCreatedAt()
        );
    }
}
