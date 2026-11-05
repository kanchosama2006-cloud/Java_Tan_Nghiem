package com.example.caro.model;

import com.example.caro.dto.MoveDto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OnlineRoom {

    private String roomCode;          // Ví dụ: CARO89
    private Long hostUserId;          // ID tài khoản tạo phòng (X)
    private String playerX;           // Tên hiển thị người chơi X
    private Long guestUserId;         // ID tài khoản tham gia (O), ban đầu null
    private String playerO;           // Tên hiển thị người chơi O
    private int boardSize;            // 3, 5, hoặc 10
    private String gameMode;          // "INFINITE" hoặc "CLASSIC"
    private String status;            // "WAITING", "PLAYING", "FINISHED"
    private char currentTurn;         // 'X' hoặc 'O'
    private String winner;            // null, "X", "O", "DRAW"
    private List<MoveDto> moves;      // Danh sách các nước đi đã đánh
    private Long savedGameId;         // ID ván đấu sau khi lưu vào MySQL
    private boolean readyX;           // Trạng thái sẵn sàng của X
    private boolean readyO;           // Trạng thái sẵn sàng của O
    private LocalDateTime createdAt;  // Thời điểm tạo phòng
    private LocalDateTime lastActivityAt; // Thời điểm hoạt động cuối

    public OnlineRoom() {
        this.moves = new ArrayList<>();
        this.status = "WAITING";
        this.currentTurn = 'X';
        this.readyX = false;
        this.readyO = false;
        this.createdAt = LocalDateTime.now();
        this.lastActivityAt = LocalDateTime.now();
    }

    public OnlineRoom(String roomCode, Long hostUserId, String playerX, int boardSize, String gameMode) {
        this();
        this.roomCode = roomCode;
        this.hostUserId = hostUserId;
        this.playerX = playerX;
        this.boardSize = boardSize;
        this.gameMode = gameMode;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public Long getHostUserId() {
        return hostUserId;
    }

    public void setHostUserId(Long hostUserId) {
        this.hostUserId = hostUserId;
    }

    public String getPlayerX() {
        return playerX;
    }

    public void setPlayerX(String playerX) {
        this.playerX = playerX;
    }

    public Long getGuestUserId() {
        return guestUserId;
    }

    public void setGuestUserId(Long guestUserId) {
        this.guestUserId = guestUserId;
    }

    public String getPlayerO() {
        return playerO;
    }

    public void setPlayerO(String playerO) {
        this.playerO = playerO;
    }

    public int getBoardSize() {
        return boardSize;
    }

    public void setBoardSize(int boardSize) {
        this.boardSize = boardSize;
    }

    public String getGameMode() {
        return gameMode;
    }

    public void setGameMode(String gameMode) {
        this.gameMode = gameMode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public char getCurrentTurn() {
        return currentTurn;
    }

    public void setCurrentTurn(char currentTurn) {
        this.currentTurn = currentTurn;
    }

    public String getWinner() {
        return winner;
    }

    public void setWinner(String winner) {
        this.winner = winner;
    }

    public List<MoveDto> getMoves() {
        return moves;
    }

    public void setMoves(List<MoveDto> moves) {
        this.moves = moves;
    }

    public Long getSavedGameId() {
        return savedGameId;
    }

    public void setSavedGameId(Long savedGameId) {
        this.savedGameId = savedGameId;
    }

    public boolean isReadyX() {
        return readyX;
    }

    public void setReadyX(boolean readyX) {
        this.readyX = readyX;
    }

    public boolean isReadyO() {
        return readyO;
    }

    public void setReadyO(boolean readyO) {
        this.readyO = readyO;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastActivityAt() {
        return lastActivityAt;
    }

    public void setLastActivityAt(LocalDateTime lastActivityAt) {
        this.lastActivityAt = lastActivityAt;
    }
}
