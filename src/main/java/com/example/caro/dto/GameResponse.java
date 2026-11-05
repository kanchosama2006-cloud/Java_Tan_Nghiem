package com.example.caro.dto;

import com.example.caro.entity.Game;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GameResponse(
        Long id,
        String username,
        String playerX,
        String playerO,
        String winner,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        List<MoveDto> moves) {

    /** Ban tom tat (danh sach lich su): khong kem nuoc di. */
    public static GameResponse summary(Game g) {
        return new GameResponse(g.getId(), g.getUser().getUsername(), g.getPlayerX(), g.getPlayerO(),
                g.getWinner(), g.getStartedAt(), g.getFinishedAt(), null);
    }

    /** Ban day du (xem lai van): kem danh sach nuoc di. */
    public static GameResponse detail(Game g) {
        List<MoveDto> moves = g.getMoves().stream()
                .map(m -> new MoveDto(m.getRowIdx(), m.getColIdx(), m.getSymbol()))
                .toList();
        return new GameResponse(g.getId(), g.getUser().getUsername(), g.getPlayerX(), g.getPlayerO(),
                g.getWinner(), g.getStartedAt(), g.getFinishedAt(), moves);
    }
}
