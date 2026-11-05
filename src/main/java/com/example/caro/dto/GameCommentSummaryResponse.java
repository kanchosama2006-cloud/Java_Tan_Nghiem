package com.example.caro.dto;

import java.util.List;

public record GameCommentSummaryResponse(
        Double averageRating,
        Integer totalComments,
        List<GameCommentResponse> comments
) {}
