package com.example.caro.bot;

import com.example.caro.dto.BotMoveResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Tính Kế thừa (Inheritance) & Đa hình (Polymorphism):
 * EasyBotPlayer kế thừa từ AbstractBotPlayer và ghi đè phương thức calculateNextMove().
 * Chiến thuật: Ưu tiên đánh gần các quân đã có, kết hợp Random ngẫu nhiên.
 */
public class EasyBotPlayer extends AbstractBotPlayer {

    private final Random random = new Random();

    public EasyBotPlayer() {
        super("AI Tân Thủ (Dễ)", "EASY");
    }

    @Override
    public BotMoveResponse calculateNextMove(BoardState state, char botSymbol) {
        List<int[]> available = state.getAvailableMoves();
        if (available.isEmpty()) {
            return new BotMoveResponse(-1, -1, botName, difficultyLevel, "Bàn cờ đã đầy");
        }

        // 1. Thử tìm nước đi lân cận các quân đã có để không đánh quá xa
        List<int[]> neighborMoves = new ArrayList<>();
        int size = state.getBoardSize();

        for (int[] move : available) {
            int r = move[0];
            int c = move[1];
            boolean hasNeighbor = false;

            for (int dr = -1; dr <= 1 && !hasNeighbor; dr++) {
                for (int dc = -1; dc <= 1; dc++) {
                    int nr = r + dr;
                    int nc = c + dc;
                    if (state.isValidCoord(nr, nc) && state.getCell(nr, nc) != ' ') {
                        hasNeighbor = true;
                        break;
                    }
                }
            }

            if (hasNeighbor) {
                neighborMoves.add(move);
            }
        }

        List<int[]> pool = neighborMoves.isEmpty() ? available : neighborMoves;
        int[] chosen = pool.get(random.nextInt(pool.size()));

        return new BotMoveResponse(
                chosen[0], chosen[1],
                botName, difficultyLevel,
                "Đánh ngẫu nhiên thăm dò khu vực lân cận"
        );
    }
}
