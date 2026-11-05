package com.example.caro.bot;

import com.example.caro.dto.BotMoveResponse;

/**
 * Thể hiện Tính Trừu tượng (Abstraction) trong OOP:
 * Định nghĩa một mẫu người chơi Bot chuẩn mực.
 * Chứa các phương thức xử lý chung và bắt buộc các Bot con phải cài đặt calculateNextMove().
 */
public abstract class AbstractBotPlayer {

    protected final String botName;
    protected final String difficultyLevel;

    public AbstractBotPlayer(String botName, String difficultyLevel) {
        this.botName = botName;
        this.difficultyLevel = difficultyLevel;
    }

    public String getBotName() {
        return botName;
    }

    public String getDifficultyLevel() {
        return difficultyLevel;
    }

    /**
     * Phương thức trừu tượng tính toán nước đi tiếp theo (Bắt buộc lớp con ghi đè - Polymorphism)
     */
    public abstract BotMoveResponse calculateNextMove(BoardState state, char botSymbol);

    /**
     * Phương thức tiện ích chung: Tìm xem có nước đi nào giúp symbol thắng ngay trong 1 nước không
     */
    protected int[] findImmediateWinningMove(BoardState state, char symbol) {
        for (int[] move : state.getAvailableMoves()) {
            BoardState nextState = state.copy();
            nextState.makeMove(move[0], move[1], symbol);
            if (nextState.checkWinner() == symbol) {
                return move;
            }
        }
        return null;
    }
}
