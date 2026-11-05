package com.example.caro.dto;

import com.example.caro.model.OnlineRoom;
import java.time.LocalDateTime;
import java.util.List;

public record OnlineRoomResponse(
        String roomCode,
        Long hostUserId,
        String playerX,
        Long guestUserId,
        String playerO,
        int boardSize,
        String gameMode,
        String status,
        char currentTurn,
        String winner,
        List<MoveDto> moves,
        Long savedGameId,
        LocalDateTime createdAt
) {
    public static OnlineRoomResponse from(OnlineRoom room) {
        return new OnlineRoomResponse(
                room.getRoomCode(),
                room.getHostUserId(),
                room.getPlayerX(),
                room.getGuestUserId(),
                room.getPlayerO(),
                room.getBoardSize(),
                room.getGameMode(),
                room.getStatus(),
                room.getCurrentTurn(),
                room.getWinner(),
                List.copyOf(room.getMoves()),
                room.getSavedGameId(),
                room.getCreatedAt()
        );
    }
}
